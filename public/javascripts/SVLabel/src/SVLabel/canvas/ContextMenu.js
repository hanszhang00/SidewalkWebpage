function ContextMenu (uiContextMenu) {
    var self = { className: "ContextMenu" },
        status = {
            targetLabel: null,
            visibility: 'hidden'
        };
    var $menuWindow = uiContextMenu.holder,
        $connector = uiContextMenu.connector,
        $radioButtons = uiContextMenu.radioButtons,
        $temporaryLabelCheckbox = uiContextMenu.temporaryLabelCheckbox,
        $descriptionTextBox = uiContextMenu.textBox,
        windowWidth = $menuWindow.width(),
        windowHeight = $menuWindow.outerHeight();
    var $OKButton = $menuWindow.find("#context-menu-ok-button");
    var $radioButtonLabels = $menuWindow.find(".radio-button-labels");
    var $tags = uiContextMenu.tags;
    var lastShownLabelColor;

    var context_menu_el = document.getElementById('context-menu-holder');
    document.addEventListener('mousedown', function(event){
        //event.stopPropagation();
        var clicked_out = !(context_menu_el.contains(event.target));
        if (isOpen()){
            if (clicked_out) {
             svl.tracker.push('ContextMenu_CloseClickOut');
            handleSeverityPopup();
            }
            hide();
        }
    }); //handles clicking outside of context menu holder
    //document.addEventListener("mousedown", hide);

    $menuWindow.on('mousedown', handleMenuWindowMouseDown);
    $radioButtons.on('change', _handleRadioChange);
    $temporaryLabelCheckbox.on('change', handleTemporaryLabelCheckboxChange);
    $descriptionTextBox.on('change', handleDescriptionTextBoxChange);
    $descriptionTextBox.on('focus', handleDescriptionTextBoxFocus);
    $descriptionTextBox.on('blur', handleDescriptionTextBoxBlur);
    uiContextMenu.closeButton.on('click', handleCloseButtonClick);
    $OKButton.on('click', _handleOKButtonClick);
    $radioButtonLabels.on('mouseenter', _handleRadioButtonLabelMouseEnter);
    $radioButtonLabels.on('mouseleave', _handleRadioButtonLabelMouseLeave);
    $tags.on('click', _handleTagClick);

    var down = {};
    var lastKeyPressed = 0;
    var lastKeyCmd = false;
    onkeydown = onkeyup = function (e) {
        e = e || event; // to deal with IE
        var isMac = navigator.platform.indexOf('Mac') > -1;
        down[e.keyCode] = e.type == 'keydown';

        // Code to highlight description box on command+A or ctrl+A (depending on OS)
        if (isMac) {
            if (lastKeyCmd && down[91] && isOpen() && down[65]) {
                $descriptionTextBox.select();
                down[65] = false; //reset A key
            }//A key, menu shown

        }//mac
        else {
            if (lastKeyPressed == 17 && isOpen() && down[65]) {
                $descriptionTextBox.select();
            }//ctrl+A while context menu open
        }//windows

        // Log last keypresses
        if (e.type == 'keydown') {
            lastKeyPressed = e.keyCode;
            lastKeyCmd = e.metaKey;
        } else {
            lastKeyPressed = 0;
            lastKeyCmd = false;
        }

    }; //handles both key down and key up events

    function checkRadioButton (value) {
        uiContextMenu.radioButtons.filter(function() {return this.value == value}).prop("checked", true).trigger("click", {lowLevelLogging: false});
    }

    function getContextMenuUI(){
        return uiContextMenu;
    }

    /**
     * Returns a the value in status given a key
     * @param key The key to find in status
     * @returns The value in status if it exists. If it doesn't, returns null
     */
    function getStatus (key) {
        return (key in status) ? status[key] : null;
    }

    function getTargetLabel () {
        return getStatus('targetLabel');
    }

    /**
     * Combined with document.addEventListener("mousedown", hide), this method will close the context menu window
     * when user clicks somewhere on the window except for the area on the context menu window.
     * @param e
     */
    function handleMenuWindowMouseDown (e) {
        e.stopPropagation();
    }

    function handleDescriptionTextBoxChange(e) {
        var description = $(this).val(),
            label = getTargetLabel();
        svl.tracker.push('ContextMenu_TextBoxChange', { Description: description });
        if (label) {
            label.setProperty('description', description);
        }
    }

    function handleDescriptionTextBoxBlur() {
        svl.tracker.push('ContextMenu_TextBoxBlur');
        svl.ribbon.enableModeSwitch();
        svl.keyboard.setStatus('focusOnTextField', false);
    }

    function handleDescriptionTextBoxFocus() {
        svl.tracker.push('ContextMenu_TextBoxFocus');
        svl.ribbon.disableModeSwitch();
        svl.keyboard.setStatus('focusOnTextField', true);
    }

    function handleCloseButtonClick () {
        svl.tracker.push('ContextMenu_CloseButtonClick');
        handleSeverityPopup();
        hide();

    }

    function _handleOKButtonClick () {
        svl.tracker.push('ContextMenu_OKButtonClick');
        handleSeverityPopup();
        hide();

    }

    function handleSeverityPopup () {
        var labels = svl.labelContainer.getCurrentLabels();
        var prev_labels = svl.labelContainer.getPreviousLabels();
        if (labels.length == 0){
            labels = prev_labels;
        }
        if (labels.length > 0) {
            var last_label = labels[labels.length - 1];
            var prop = last_label.getProperties();
            svl.ratingReminderAlert.ratingClicked(prop.severity);
        }
    }

    /**
     *
     * @param e
     */
    function _handleRadioChange (e) {
        var severity = parseInt($(this).val(), 10);
        var label = getTargetLabel();
        svl.tracker.push('ContextMenu_RadioChange', { LabelType: label.getProperty("labelType"), RadioValue: severity });

        self.updateRadioButtonImages();
        if (label) {
            label.setProperty('severity', severity);
            svl.canvas.clear().render2();
        }
    }

    function _handleRadioButtonLabelMouseEnter () {
        var radioValue = parseInt($(this).find("input").attr("value"), 10);
        self.updateRadioButtonImages(radioValue);
    }

    function _handleRadioButtonLabelMouseLeave () {
        self.updateRadioButtonImages();
    }

    self.fetchLabelTags = function (callback) {
        $.when($.ajax({
            contentType: 'application/json; charset=utf-8',
            url: "/label/tags",
            type: 'get',
            success: function (json) {
                self.labelTags = json;
            },
            error: function (result) {
                throw result;
            }
        })).done(callback);
    };

    self.updateRadioButtonImages = function (hoveredRadioButtonValue) {
        var $radioButtonImages = $radioButtonLabels.find("input + img");
        var $selectedRadioButtonImage;
        var $hoveredRadioButtonImage;
        var imageURL;

        $radioButtonImages.each(function (i, element) {
            imageURL = $(element).attr("default-src");
            $(element).attr("src", imageURL);
        });

        // Update the hovered radio button image
        if (hoveredRadioButtonValue && hoveredRadioButtonValue > 0 && hoveredRadioButtonValue <= 5) {
            $hoveredRadioButtonImage = $radioButtonLabels.find("input[value='" + hoveredRadioButtonValue + "'] + img");
            imageURL = $hoveredRadioButtonImage.attr("default-src");
            imageURL = imageURL.replace("_BW.png", ".png");
            $hoveredRadioButtonImage.attr("src", imageURL);
        }

        // Update the selected radio button image
        $selectedRadioButtonImage = $radioButtonLabels.find("input:checked + img");
        if ($selectedRadioButtonImage.length > 0) {
            imageURL = $selectedRadioButtonImage.attr("default-src");
            imageURL = imageURL.replace("_BW.png", ".png");
            $selectedRadioButtonImage.attr("src", imageURL);
        }
    };

    /**
     * Records tag ID when clicked and updates tag color
     */
    function _handleTagClick (e) {
        var label = getTargetLabel();
        var labelTags = label.getProperty('tagIds');

        // Use position of cursor to determine whether or not the click came from the mouse, or from a keyboard shortcut
        var wasClickedByMouse = e.hasOwnProperty("originalEvent") && e.originalEvent.clientX != 0 && e.originalEvent.clientY != 0;

        $("body").unbind('click').on('click', 'button', function (e) {
            if (e.target.name == 'tag') {
                var tagValue = e.target.textContent || e.target.innerText;

                // Adds or removes tag from the label's current list of tags.
                self.labelTags.forEach(function (tag) {
                    if (tag.tag === tagValue) {
                        if (!labelTags.includes(tag.tag_id)) {
                            var alternateRoutePresentStr = 'alternate route present';
                            var noAlternateRouteStr = 'no alternate route';
                            // Automatically deselect one of the tags above if the other one is selected
                            if (tagValue === alternateRoutePresentStr) {
                                labelTags = autoRemoveAlternateLabelAndUpdateUI(noAlternateRouteStr, labelTags);
                                
                            } else if (tagValue === noAlternateRouteStr) {
                                labelTags = autoRemoveAlternateLabelAndUpdateUI(alternateRoutePresentStr, labelTags);
                            }

                            var streetHasOneSidewalk = 'street has a sidewalk';
                            var streetHasNoSidewalks = 'street has no sidewalks';
                            // Automatically deselect one of the tags above if the other one is selected
                            if (tagValue === streetHasOneSidewalk) {
                                labelTags = autoRemoveAlternateLabelAndUpdateUI(streetHasNoSidewalks, labelTags);

                            } else if (tagValue === streetHasNoSidewalks) {
                                labelTags = autoRemoveAlternateLabelAndUpdateUI(streetHasOneSidewalk, labelTags);
                            }

                            labelTags.push(tag.tag_id);
                            if (wasClickedByMouse) {
                                svl.tracker.push('ContextMenu_TagAdded',
                                    {tagId: tag.tag_id, tagName: tag.tag});
                            } else {
                                svl.tracker.push('KeyboardShortcut_TagAdded',
                                    {tagId: tag.tag_id, tagName: tag.tag});
                            }
                        } else {
                            var index = labelTags.indexOf(tag.tag_id);
                            labelTags.splice(index, 1);
                            if (wasClickedByMouse) {
                                svl.tracker.push('ContextMenu_TagRemoved',
                                    {tagId: tag.tag_id, tagName: tag.tag});
                            } else {
                                svl.tracker.push('KeyboardShortcut_TagRemoved',
                                    {tagId: tag.tag_id, tagName: tag.tag});
                            }
                        }
                        _toggleTagColor(labelTags, tag.tag_id, e.target);
                        label.setProperty('tagIds', labelTags);
                    }
                });
                e.target.blur();
                getContextMenuUI().tags.trigger('tagIds-updated'); // For events that depend on tagIds to be up-to-date
            }
        });
    }

    /**
     * Remove the alternate lable, update UI, and add the selected label.
     * @param {*} labelName     The name of the label to be removed.
     * @param {*} labelTags     List of tags that the current label has.
     */
    function autoRemoveAlternateLabelAndUpdateUI(labelName, labelTags) {
        $tags.each((index, tag) => {if (tag.innerText === labelName) {tag.style.backgroundColor = "white"; } });
        self.labelTags.forEach(tag => {
            if (tag.tag === labelName && labelTags.includes(tag.tag_id)) {
                labelTags.splice(labelTags.indexOf(tag.tag_id), 1);
                svl.tracker.push('ContextMenu_TagAutoRemoved',
                    { tagId: tag.tag_id, tagName: tag.tag });
            }
        });
        return labelTags;
    }

    /**
     *
     * @param e
     */
    function handleTemporaryLabelCheckboxChange (e) {
        var checked = $(this).is(":checked"),
            label = getTargetLabel();
        svl.tracker.push('ContextMenu_CheckboxChange', { checked: checked });

        if (label) {
            label.setProperty('temporaryLabel', checked);
        }
    }

    /**
     * Hide the context menu
     * @returns {hide}
     */
    function hide () {
        if(isOpen()) {
            $descriptionTextBox.blur(); // force the blur event before the ContextMenu close event
            svl.tracker.push('ContextMenu_Close');
        }

        $menuWindow.css('visibility', 'hidden');
        $connector.css('visibility', 'hidden');
        setBorderColor('black');
        setStatus('visibility', 'hidden');
        return this;
    }

    /**
     * Unhide the context menu
     * @returns {hide}
     */
    function unhide () {
        $menuWindow.css('visibility', 'visible');
        if (lastShownLabelColor) {
            setBorderColor(lastShownLabelColor);
        }
        setStatus('visibility', 'visible');
        return this;
    }

    /**
     * Checks if the menu is open or not
     * @returns {boolean}
     */
    function isOpen() {
        return getStatus('visibility') == 'visible';
    }

    /**
     * Set the border color of the menu window
     * @param color
     */
    function setBorderColor(color) {
        $menuWindow.css('border-color', color);
        $connector.css('background-color', color);
    }

    /**
     * Sets a status
     * @param key
     * @param value
     * @returns {setStatus}
     */
    function setStatus (key, value) {
        status[key] = value;
        return this;
    }


    /**
     * Sets the color of a label's tags based off of tags that were previously chosen.
     * @param label     Current label being modified.
     */
    function setTagColor(label) {
        var labelTags = label.getProperty('tagIds');
        $("body").find("button[name=tag]").each(function(t) {
            var buttonText = $(this).text();
            if (buttonText) {
                var tagId = undefined;

                // Finds the tag id based of the current button based off text description.
                self.labelTags.forEach(function (tag) {
                    if (tag.tag === buttonText) {
                        tagId = tag.tag_id;
                    }
                });

                // Sets color to be white or gray if the label tag has been selected.
                if (labelTags.includes(tagId)) {
                    $(this).css('background-color', 'rgb(200, 200, 200)');
                } else {
                    $(this).css('background-color', 'white');
                }
            }
        });
    }

    /**
     * Sets the description and value of the tag based on the label type.
     * @param label     Current label being modified.
     */
    function setTags (label) {
        var maxTags = 10;
        if (label) {
            var labelTags = self.labelTags;
            if (labelTags) {
                var count = 0;

                // Go through each label tag, modify each button to display tag.
                labelTags.forEach(function (tag) {
                    if (tag.label_type === label.getProperty('labelType')) {

                        // Remove all leftover tags from last labeling. Warning to future devs: will remove any other classes you add to the tags
                        $("body").find("button[id=" + count + "]").attr('class', 'context-menu-tag');

                        // Add tag name as a class so that finding the element is easier laster. For example, will add "narrowSidewalk-tag" as a class
                        var newClass = util.misc.getLabelDescriptions(tag.label_type)['tagInfo'][tag.tag]['id'] + "-tag";
                        $("body").find("button[id=" + count + "]").addClass(newClass);

                        // Set tag texts to new underlined version as defined in the util label description map
                        var tagText = util.misc.getLabelDescriptions(tag.label_type)['tagInfo'][tag.tag]['text'];
                        $("body").find("button[id=" + count + "]").html(tagText);

                        $("body").find("button[id=" + count + "]").css({
                            visibility: 'inherit',
                            position: 'inherit'
                        });
                        count += 1;
                    }
                });

                // If number of tags is less than the max number of tags, hide button.
                var i = count;
                for (i; i < maxTags; i++) {
                    $("body").find("button[id=" + i + "]").css({
                        visibility: 'hidden',
                        position: 'absolute',
                        top: '0px',
                        left: '0px'
                    });
                }
            }
        }
    }

    /**
     * Show the context menu
     * @param x x-coordinate on the canvas pane
     * @param y y-coordinate on the canvas pane
     * @param param a parameter object
     */
    function show (x, y, param) {
        setStatus('targetLabel', null);
        $radioButtons.prop('checked', false);
        $temporaryLabelCheckbox.prop('checked', false);
        $descriptionTextBox.val(null);
        if (x && y && ('targetLabel' in param)) {
            var labelType = param.targetLabel.getLabelType(),
                acceptedLabelTypes = ['SurfaceProblem', 'Obstacle', 'NoCurbRamp', 'NoSidewalk', 'Other', 'CurbRamp'];
            if (acceptedLabelTypes.indexOf(labelType) != -1) {
                setStatus('targetLabel', param.targetLabel);
                setTags(param.targetLabel);
                setTagColor(param.targetLabel);
                windowHeight = $('#context-menu-holder').outerHeight();

                $("#test-rectangle").css({
                    position: 'absolute',
                    visibility: 'visible',
                    top: y,
                    left: x,
                    width: '2px',
                    height: '2px',
                });

                // Determines coordinates for context menu when displayed below the label.
                var topCoordinate = y + 20;
                var connectorCoordinate = -10;

                // Determines coordinates for context menu when displayed above the label.
                if(y + windowHeight + 22 > 480) {
                    topCoordinate = y - windowHeight - 22;
                    connectorCoordinate = windowHeight;
                }

                $menuWindow.css({
                    visibility: 'visible',
                    left: x - windowWidth / 2,
                    top: topCoordinate
                });

                $connector.css({
                    visibility: 'visible',
                    top: topCoordinate + connectorCoordinate,
                    left: x - 3
                });

                if (param) {
                    if ('targetLabelColor' in param) {
                        setBorderColor(param.targetLabelColor);
                        lastShownLabelColor = param.targetLabelColor;
                    }
                }
                setStatus('visibility', 'visible');

                // Set the menu value if label has it's value set.
                var severity = param.targetLabel.getProperty('severity'),
                    temporaryLabel = param.targetLabel.getProperty('temporaryLabel'),
                    description = param.targetLabel.getProperty('description');
                if (severity) {
                    $radioButtons.each(function (i, v) {
                       if (severity == i + 1) { $(this).prop("checked", true); }
                    });
                }

                if (temporaryLabel) {
                    $temporaryLabelCheckbox.prop("checked", temporaryLabel);
                }

                if (description) {
                    $descriptionTextBox.val(description);
                } else {
                    var defaultText = "Description (optional)";
                    $descriptionTextBox.prop("placeholder", defaultText);
                }
                var labelProperties = self.getTargetLabel().getProperties();

                //don't push event on Occlusion or NoSidewalk labels; they don't open ContextMenus
                svl.tracker.push('ContextMenu_Open', {'auditTaskId': labelProperties.audit_task_id}, {'temporaryLabelId': labelProperties.temporary_label_id});
            }
        }
        self.updateRadioButtonImages();
    }

    /**
     * Toggles the color of the tag when selected/deselected.
     * @param labelTags     List of tags that the current label has.
     * @param id
     * @param target        Tag button that is being modified.
     */
    function _toggleTagColor(labelTags, id, target) {
        if (labelTags.includes(id)) {
            target.style.backgroundColor = 'rgb(200, 200, 200)';
        } else {
            target.style.backgroundColor = "white";
        }
    }

    self.getContextMenuUI = getContextMenuUI;
    self.checkRadioButton = checkRadioButton;
    self.getTargetLabel = getTargetLabel;
    self.handleSeverityPopup = handleSeverityPopup;
    self.hide = hide;
    self.unhide = unhide;
    self.isOpen = isOpen;
    self.show = show;
    return self;
}
