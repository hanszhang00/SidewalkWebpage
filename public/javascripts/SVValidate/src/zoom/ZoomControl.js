/**
 * Handles zooming for the Google StreetView panorama. This is also called by the
 * Keyboard class to deal with zooming via keyboard shortcuts.
 * @returns {ZoomControl}
 * @constructor
 */
function ZoomControl () {
    var self = this;
    var zoomInButton = $("#zoom-in-button");
    var zoomOutButton = $("#zoom-out-button");

    /**
     * Logs interaction when the zoom in button is clicked.
     */
    function clickZoomIn () {
        svv.tracker.push("Click_ZoomIn");
        zoomIn();
    }

    /**
     * Logs interaction when the zoom out button is clicked.
     */
    function clickZoomOut () {
        svv.tracker.push("Click_ZoomOut");
        zoomOut();
    }

    /**
     * Increases zoom for the Google StreetView Panorama and checks if 'Zoom In' button needs
     * to be disabled.
     * Zoom levels: {1.1, 2.1, 3.1}
     */
    function zoomIn () {
        var zoomLevel = svv.panorama.getZoom();
        if (zoomLevel <= 2.1) {
            zoomLevel += 1;
            svv.panorama.setZoom(zoomLevel);
        }
        updateZoomAvailability();
    }

    /**
     * Decreases zoom for the Google StreetView Panorama and checks if 'Zoom Out' button needs
     * to be disabled.
     * Zoom levels: {1.1, 2.1, 3.1}
     */
    function zoomOut () {
        var zoomLevel = svv.panorama.getZoom();
        if (zoomLevel >= 2.1) {
            zoomLevel -= 1;
            svv.panorama.setZoom(zoomLevel);
        }
        updateZoomAvailability();
    }

    /**
     * Changes the opacity and enables/disables the zoom buttons depending on the 'zoom level'. It
     * disables and 'greys-out' the zoom in button in the most zoomed in state and the zoom out
     * button in the most zoomed out state.
     * Zoom levels: {1.1(Zoom-out Disabled), 2.1(Both buttons enabled), 3.1(Zoom-In Disabled)}
     */
    function updateZoomAvailability() {
        if (svv.panorama.getZoom() >= 3.1) {
            zoomInButton.css('opacity', 0.5);
            zoomInButton.addClass('disabled');
            zoomOutButton.css('opacity', 1);
            zoomOutButton.removeClass('disabled');
        } else if (svv.panorama.getZoom() <= 1.1) {
            zoomOutButton.css('opacity', 0.5);
            zoomOutButton.addClass('disabled');
            zoomInButton.css('opacity', 1);
            zoomInButton.removeClass('disabled');
        } else {
            zoomOutButton.css('opacity', 1);
            zoomOutButton.removeClass('disabled');
            zoomInButton.css('opacity', 1);
            zoomInButton.removeClass('disabled');
        }
    }

    zoomInButton.on('click', clickZoomIn);
    zoomOutButton.on('click', clickZoomOut);

    self.zoomIn = zoomIn;
    self.zoomOut = zoomOut;
    self.updateZoomAvailability = updateZoomAvailability;

    /**
     * When ZoomControl is called, it initializes the zoom in/out buttons to either be enabled
     * or disabled based on zoom level.
     */
    updateZoomAvailability();

    return this;
}
