$(function () {
    // init socket.io
    var socket = io.connect({path:'/posm-admin/socket.io'});
    // TODO get from url
    var deployment = 'atlas-deploy';
    var pathname = window.location.pathname; // Returns path only
    var deploymentStatus;

    // get deployment status on page load
    POSM.deployment.updateDeploymentStatus(function(data){
        deploymentStatus = data[deployment];
        updateSupportMessage(deploymentStatus.msg);
        showProgressSpinner(deploymentStatus);
        updateDeploySubNav(deploymentStatus);

        if(!deploymentStatus.initialized && !deploymentStatus.complete) {
            updateSupportMessage("Take the bounds of an atlas from a Field Paper and create an OpenMapKit deployment.");
        } else {
            // Add field papers geojson url
            if($('#fp-geojson-url').val() == "") {
                $('#fp-geojson-url').val(deploymentStatus.fpGeoJsonUrl);
                // remove background label
                $("#fp-geojson-url-label").html("");
            }
        }
    });

    // do this on url submission
    $('#action-btn').click(function (evt) {
        var postJson = {};
        postJson.url = $('#fp-geojson-url').val();
        $.post('/posm-admin/atlas-deploy', postJson)
            .done(function (data) {

                $('#snackbar').get(0).MaterialSnackbar.showSnackbar({
                    message: data.msg,
                    timeout: 3000,
                    actionHandler: function (event) {
                        // TODO Cancel
                    },
                    actionText: 'Cancel'
                });
            })
            .error(function(err){
                $('#snackbar').get(0).MaterialSnackbar.showSnackbar({
                    message: JSON.parse(err.responseText).msg,
                    timeout: 3000,
                    actionHandler: function (event) {
                        // TODO Cancel
                    },
                    actionText: 'Cancel'
                });
                updateSupportMessage(JSON.parse(err.responseText).msg);
                updateNavBarStatusIcon(null,'error_outline');

            });
        evt.preventDefault();
    });

    // cancel process
    $('#cancelProcess').click(function (evt){
        socket.emit('atlas-deploy/kill');
    });

    // listen for stdout on posm
    socket.on('atlas-deploy', function (iomsg) {
        // handles progress spinner
        showProgressSpinner(iomsg.status);

        // add hot export URL when page is opened during installation
        if($('#fp-geojson-url').val() == "") {
            $('#fp-geojson-url').val(iomsg.exportUrl);
            // remove background label
            $("#fp-geojson-url-label").html("");
        }

        // in progress
        if(iomsg.status.initialized){
            updateSupportMessage(iomsg.status.msg);
            updateDeploySubNav(iomsg.status);
            updateNavBarStatusIcon('initialized');
        }

        if (iomsg.output) {
            if(iomsg.status.error){
                // red console text on error
                var span = $('<span />').addClass("msg-error").html(iomsg.output);
                $('#console').append(span);
            } else {
                $('#console').append(iomsg.output);
            }
            // keep scroll at bottom of console output
            var d = $('#console');
            d.scrollTop(d.prop("scrollHeight") + 45);
        }
        // done
        if (iomsg.status.complete) {
            // false means the scripts exited without trouble
            if (!iomsg.status.error) {
                updateSupportMessage(iomsg.status.msg);
                updateNavBarStatusIcon('complete');
                updateDeploySubNav(iomsg.status);

                var manifest = iomsg.manifest;
                if (manifest) {
                    receiveManifest(manifest);
                }
            } else {
                updateNavBarStatusIcon(null,'error');
            }
        }

    });

    // update status message above url input
    function updateSupportMessage (text) {
        $('#supporting-msg-txt').html(text);
    }

    // update nav bar icon
    function updateNavBarStatusIcon (status, icon) {
        var icon_text = (status == 'initialized') ? 'compare_arrows' : 'check_circle';
        if (icon) icon_text = icon;

        $(".mdl-navigation__link").each(function (i,o) {
            if (o.pathname == pathname.substring(0,pathname.length-1)) {
                $(o.childNodes[0]).text(icon_text);
            }
        });
    }

    // update deploy sub scripts icons
    function updateDeploySubNav (status, selector){

        $(".deploy-sub-nav li").each(function (i,o) {
            if (status[o.id]) {
                var icon_text = (status[o.id].initialized) ? 'compare_arrows' : 'brightness_1';
                icon_text = (status[o.id].complete) ? 'check_circle' : icon_text;
                $(o.childNodes[0]).text(icon_text);
            }
        });
    }

    function receiveManifest(manifest) {
        $('.deployment-title').html(manifest.title);
        $('a[href*="/deployment/"]').each(function () {
            $(this).attr('href', $(this).attr('href') + '?deployment=' + manifest.name);
        });
        window.history.replaceState({} , manifest.title, window.location.href.split('?')[0] + '?deployment=' + manifest.name);
    }

    // hide spinner and disable action button
    function showProgressSpinner (status) {
        if(status.initialized){
            $("#atlas-deploy-progress-spinner").show();
            // disable star button
            $("#action-btn").prop("disabled", true);
        } else {
            $("#atlas-deploy-progress-spinner").hide();
            $("#action-btn").prop("disabled", false);
        }
    }

});

