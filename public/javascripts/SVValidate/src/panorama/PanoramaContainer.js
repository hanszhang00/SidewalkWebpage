/**
 * Holds the list of labels to be validated, and distributes them to the panoramas that are on the
 * page. Fetches labels from the backend and converts them into Labels that can be placed onto the
 * GSV Panorama.
 * @param labelList     Initial list of labels to be validated (generated when the page is loaded).
 * @param canvasList    List of panorama canvas IDs for each panorama to be displayed on the screen.
 * @returns {PanoramaContainer}
 * @constructor
 */
function PanoramaContainer (labelList, canvasList) {
    let self = this;
    let labels = labelList;    // labels that all panoramas from the screen are going to be validating from
    let panoList = {};
    let properties = {
        progress: 0             // used to keep track of which index to retrieve from labels
    };

    /**
     * Initializes panorama(s) on the validate page.
     * @private
     */
    function _init () {
        canvasList.forEach(function(canvasId) {
            panoList[canvasId] = new Panorama(labelList[getProperty("progress")], canvasId);
            setProperty("progress", getProperty("progress") + 1);
        });

        // temporary... to maintain functionality (yikes)
        svv.panorama = panoList["svv-panorama-1"];
    }

    /**
     * Uses label metadata to initialize a new label.
     * @param metadata  Metadata for the label.
     * @returns {Label} Label object for this label.
     * @private
     */
    function _createSingleLabel (metadata) {
        let labelMetadata = {
            canvasHeight: metadata.canvas_height,
            canvasWidth: metadata.canvas_width,
            canvasX: metadata.canvas_x,
            canvasY: metadata.canvas_y,
            gsvPanoramaId: metadata.gsv_panorama_id,
            heading: metadata.heading,
            labelId: metadata.label_id,
            labelType: metadata.label_type,
            pitch: metadata.pitch,
            zoom: metadata.zoom
        };
        return new Label(labelMetadata);
    }

    /**
     * Fetches a single label from the database.  When the user clicks skip, need to get more
     * because missions fetch exactly the number of labels that are needed to complete the mission.
     */
    function fetchNewLabel () {
        let labelTypeId = svv.missionContainer.getCurrentMission().getProperty('labelTypeId');
        let labelUrl = "/label/geo/random/" + labelTypeId;

        let data = {};
        data.labels = svv.labelContainer.getCurrentLabels();

        if (data.constructor !== Array) {
            data = [data];
        }

        $.ajax({
            async: false,
            contentType: 'application/json; charset=utf-8',
            url: labelUrl,
            type: 'post',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (labelMetadata) {
                labels.push(_createSingleLabel(labelMetadata));
                setProperty('progress', getProperty('progress') + 1);
                svv.panorama.setLabel(labels[getProperty('progress')]);
            }
        });
    }

    /**
     * Gets a specific property from the PanoramaContainer.
     * @param key   Property name.
     * @returns     Value associated with this property or null.
     */
    function getProperty (key) {
        return key in properties ? properties[key] : null;
    }

    function loadNewLabelOntoPanorama () {
        svv.panorama.setLabel(labels[getProperty('progress')]);
        setProperty('progress', getProperty('progress') + 1);
        if (!svv.labelVisibilityControl.isVisible()) {
            svv.labelVisibilityControl.unhideLabel();
        }
        svv.zoomControl.updateZoomAvailability();
    }

    /**
     * Resets the state of the mission.
     * Called when a new validation mission is loaded, and when we need to get rid of lingering
     * data from the previous validation mission.
     */
    function reset () {
        setProperty('progress', 0);
    }

    /**
     * Creates a list of label objects to be validated from label metadata.
     * Called when a new mission is loaded onto the screen.
     * @param labelList Object containing key-value pairings of (index, labelMetadata)
     */
    function setLabelList (labelList) {
        Object.keys(labelList).map(function(key, index) {
            labelList[key] = _createSingleLabel(labelList[key]);
        });

        labels = labelList;
    }

    /**
     * Sets a property for the PanoramaContainer.
     * @param key   Name of property
     * @param value Value of property.
     * @returns {setProperty}
     */
    function setProperty (key, value) {
        properties[key] = value;
        return this;
    }

    /**
     * Retrieves a label with a given id from the database and adds it to the label list.
     * NOTE: Currently unused, but may be useful later.
     * @param labelId   label_id of the desired label.
     */
    function setLabelWithId (labelId) {
        let labelUrl = "/label/geo/" + labelId;
        $.ajax({
            url: labelUrl,
            async: false,
            dataType: 'json',
            success: function (labelMetadata) {
                let label = _createSingleLabel(labelMetadata);
                labels.push(label);
            }
        });
    }

    self.fetchNewLabel = fetchNewLabel;
    self.getProperty = getProperty;
    self.loadNewLabelOntoPanorama = loadNewLabelOntoPanorama;
    self.setProperty = setProperty;
    self.reset = reset;
    self.setLabelList = setLabelList;

    _init();

    return this;
}
