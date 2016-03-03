$(function () {

    // init socket.io
    var socket = io.connect({path:'/posm-admin/socket.io'});

    // Get deployment name.
    var deploymentName = POSM.deployment.getParam('deployment');

    // Check the status of the deployment.
    checkStatus(deploymentName);

    // Listen for updates on the status from socket.io
    listenForStatusUpdates(socket, deploymentName);

    // Handle click of the action buttons.
    handleApi2PbfButton(deploymentName);
    handlePbf2RenderButton(deploymentName);
    handleAllButton(deploymentName);


    function checkStatus(deploymentName) {
        if (typeof deploymentName !== 'string') return;
        var url = '/posm-admin/status?deployment=' + deploymentName;
        $.get(url, function (data) {
            updateUIFromStatus(data);
        }).fail(function() {
            // QUICK FIX: .showSnackbar is not always a function ???
            setTimeout(function () {
                $('#snackbar').get(0).MaterialSnackbar.showSnackbar({
                    message: 'There is no deployment with the name: ' + deploymentName,
                    timeout: 100000,
                    actionHandler: function (event) {
                        window.location = '/posm-admin/deployment/'
                    },
                    actionText: 'Start over'
                });
            }, 500);
        });
    }

    function listenForStatusUpdates(socket, deploymentName) {
        socket.on('render-db', function (iomsg) {
            console.log(iomsg);
            if (iomsg.output) {
                $('#console').append(iomsg.output);
            }

            // done
            if (iomsg.close) {
                var $instructionsDiv = $('#instructions-div');
                $instructionsDiv.show();
                $('#supporting-msg-div').hide();
                // false means the scripts exited without trouble
                if (iomsg.code === false) {
                    $instructionsDiv.html('operation complete');
                } else {
                    $instructionsDiv.html('error');
                }
            }

            // status update
            if (iomsg.status) {
                updateUIFromStatus(iomsg.status);
            }
        });
    }

    function updateUIFromStatus(status) {
        var keys = Object.keys(status);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var val = status[key];
            // it was a success
            if (val === 'done') {
                $('a[href*="/'+key+'/"]>i').html('check_circle');
            }
            // it was a failure
            else {
                $('a[href*="/'+key+'/"]>i').html('error');
            }
        }
    }

    function handleApi2PbfButton(deploymentName) {
        $('#api2pbf-btn').click(function (evt) {
            $.post('/posm-admin/render-db/api2pbf', {deployment: deploymentName})
                .done(function (data) {

                    $('#supporting-msg-div').show();
                    $('#instructions-div').hide();
                    $('#supporting-msg-txt').html(data.msg);

                    listenForStatusUpdates(socket, data.deployment);

                });
            evt.preventDefault();
        });
    }

    function handlePbf2RenderButton(deploymentName) {
        $('#pbf2render-btn').click(function (evt) {
            $.post('/posm-admin/render-db/pbf2render', {deployment: deploymentName})
                .done(function (data) {

                    $('#supporting-msg-div').show();
                    $('#instructions-div').hide();
                    $('#supporting-msg-txt').html(data.msg);

                    listenForStatusUpdates(socket, data.deployment);

                });
            evt.preventDefault();
        });
    }

    function handleAllButton(deploymentName) {
        $('#reset-and-populate-btn').click(function (evt) {
            $.post('/posm-admin/render-db/all', {deployment: deploymentName})
                .done(function (data) {

                    $('#supporting-msg-div').show();
                    $('#instructions-div').hide();
                    $('#supporting-msg-txt').html(data.msg);

                    listenForStatusUpdates(socket, data.deployment);

                });
            evt.preventDefault();
        });
    }

});
