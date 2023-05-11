(function() {
    BBPlugin.register('blockbench_flans_plugin', {
        title: 'Flan\'s Mod Plugin',
        author: 'Feefkroete',
        icon: 'fas.fa-jet-fighter',
        description: 'Flan\'s Mod model support for Blockbench',
        version: '0.0.1',
        variant: 'both',
        onload() {
            console.log("Flan\'s Mod format plugin loaded.")
        },
        onunload() {
            format.delete();
            Blockbench.removeListener(onProjectConfirm);
        }
    });

    //These are Templates for the individual Model types supported by ModelRendererTurbo. The parts arrays are used to generate the right group names as well as later the correct array names in the exported java class.
    //The imports contain the neccesary imports which are needed in the java class.
    const Templates = {
        'Plane': {
            name: 'Plane Model',
            extension: 'ModelPlane',
            remember: true,
            parts: ['noseModel', 'leftWingModel', 'rightWingModel', 'topWingModel', 'bayModel', 'tailModel', 'propellerModels', 'yawFlapModel', 'pitchFlapLeftModel', 'pitchFlapRightModel', 'pitchFlapLeftWingModel', 'pitchFlapRightWingModel', 'heliMainRotorModels', 'heliTailModels', 'skidsModel', 'helicopterModeParts', 'planeModeParts', 'bodyWheelModel', 'tailWheelModel', 'leftWingWheelModel', 'rightWingWheelModel', 'tailDoorOpenModel', 'tailDoorCloseModel', 'rightWingPos1Model', 'rightWingPos2Model', 'leftWingPos1Model', 'leftWingPos2Model', 'hudModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelPlane']
        },
        'Vehicle': {
            name: 'Vehicle Model',
            extension: 'ModelVehicle',
            remember: true,
            parts: ['turretModel', 'barrelModel', 'ammoModel', 'frontWheelModel', 'backWheelModel', 'leftFrontWheelModel', 'rightFrontWheelModel', 'leftBackWheelModel', 'rightBackWheelModel', 'rightTrackModel', 'leftTrackModel', 'rightTrackWheelModels', 'leftTrackWheelModels', 'fancyTrackModel', 'leftAnimTrackModel', 'rightAnimTrackModel', 'bodyDoorOpenModel', 'bodyDoorCloseModel', 'trailerModel', 'steeringWheelModel', 'drillHeadModel', 'animBarrelModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelVehicle']
        },
        'Mecha': {
            name: 'Mecha Model',
            extension: 'ModelMecha',
            remember: true,
            parts: ['leftArmModel', 'rightArmModel', 'leftHandModel', 'rightHandModel', 'hipsModel', 'leftLegModel', 'rightLegModel', 'leftFootModel', 'rightFootModel', 'leftRearLegModel', 'rightRearLegModel', 'leftFrontLegModel', 'rightFrontLegModel', 'headModel', 'barrelModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelMecha']
        },
        'Gun': {
            name: 'Gun Model',
            extension: 'ModelGun',
            remember: true,
            parts: ['gunModel', 'defaultBarrelModel', 'defaultScopeModel', 'defaultStockModel', 'defaultGripModel', 'ammoModel', 'revolverBarrelModel', 'breakActionModel', 'slideModel', 'pumpModel', 'minigunBarrelModel', 'leverActionModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelGun']
        },
        'AA Gun': {
            name: 'AA Gun Model',
            extension: 'ModelAAGun',
            remember: true,
            parts: ['baseModel', 'seatModel', 'gunModel', 'barrelModel', 'ammoModel', 'gunsightModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelAAGun']
        },
        'Armour': {
            name: 'Armour Model',
            extension: 'ModelCustomArmour',
            remember: true,
            parts: ['headModel', 'bodyModel', 'leftArmModel', 'rightArmModel', 'leftLegModel', 'rightLegModel', 'skirtFrontModel', 'skirtRearModel'],
            imports: ['com.flansmod.client.tmt.ModelRendererTurbo', 'com.flansmod.client.model.ModelCustomArmour']
        },
        'Custom Type': {
            name: 'Custom Model',
            extension: '',
            remember: true,
            parts: [],
            imports: []
        },
    };

    //This Codec is used to export the cubes correctly into a java class.
    var codec = new Codec ('flans_format', {
        name: 'Flan\'s mod format (Java)',
        extension: 'java',
        remember: true,
        load_filter: {
            type: 'text',
            extensions: ['java']
        },
        //This method will be called when exporting the model
        compile(options) {
            let model = '';     //initialize the model data String
            //Append the neccesary imports determined by the chosen template
            for (let i of Templates[Project.flans_format_type].imports) {
                model = model + 'import ' + i + ';\n';
            }
            model += '\n';

            //public class... stuff for Java. The ModelName, as well as the extension determined by the chosen template are inserted.
            model += 'public class ' + Project.name + ' extends ' + Templates[Project.flans_format_type].extension + ' {\n';
            model += '    int tX = ' + Project.texture_width + ';\n    int tY = ' + Project.texture_height + ';\n';
            model += '    public ' + Project.name + ' () {\n\n'

            model += '        //Initiate Parts\n';      //Comment in Java class for better readability
            let relevant_parts = new Array();
            //Only select groups which contain cubes and save them in "relevant_parts"
            for (let g of getAllGroups()) {
                //Check if the name matches one of the groups of the chosen template
                if (Templates[Project.flans_format_type].parts.includes(g.name) && g.children.length > 0) {
                    relevant_parts.push(g);
                    model = model + '        ' + g.name + ' = new ModelRendererTurbo[' + g.children.length + '];\n';    //Append the group as an Array to the model data String
                }
            }
            model += '\n';
            //Cycle through "relevant_parts", get the
            for (let p of relevant_parts) {
                model += '        //' + p.name + '\n';      //Comment in the Java code: Name of the part
                for (let i = 0; i<p.children.length; i++) {
                    //For all cubes in the current group (= part in Flan's Mod): Generate new ModelRendererTurbo objects
                    model = model + '        ' + p.name + '[' + i + '] = new ModelRendererTurbo(this,' + p.children[i].uv_offset[0] + ',' + p.children[i].uv_offset[1] + ',tX, tY);\n'
                }
                //For all cubes in the current group: Get the current ModelRendererTurbo object and call "addBox" as well as "setRotationPoint" and add the data from this cube
                for (let c = 0; c<p.children.length; c++) {
                    let object = p.children[c];
                    let f = object.from;
                    let origin = object.origin.slice();
                    if (object instanceof Cube) {
                        model += '        //' + object.name + '\n';
                        model += '        ' + p.name + '[' + c + '].addBox(' + f[0]+'F,'+f[1]+'F,'+f[2]+'F,'+object.size(0, true)+'F,'+object.size(1, true)+'F,'+object.size(2, true)+'F);\n';
                        model += '        ' + p.name + '[' + c + '].setRotationPoint(' +origin[0] +'F,'+origin[1]*-1+'F,'+origin[2] + 'F);\n'
                    }
                }
                model += '\n'
            }
            model += '    }\n}';

            //Finish the export, return the model data
            let event = {model, options};
            this.dispatchEvent('compile', event);
            return event.model;
        }
    });

    codec.templates = Templates;    //Assign the Templates to the codec so they will be displayed in the new Project dialog
    Object.defineProperty(codec, 'remember', {
        get() {
            return !!Codecs.flans_format.templates[Project.flans_format_type].remember
        }
    });

    var format = new ModelFormat ({
        id: "flans_format",
        name: "Flan's Mod Model",
        category: 'minecraft',
        target: 'Minecraft: Java Edition',
        description: "Model for Flan's Mod",
        icon: "fas.fa-jet-fighter",
        codec,
        rotate_cubes: true,
        box_uv: true,
        centered_grid: true,
        locators: true,
        meshes: true,
        model_identifier: false,     //Disable the "model identifier"-field in Project dialog
        optional_box_uv: false,
    });
    new Property(ModelProject, 'string', 'name', {      //Override name field to be more understandable regarding the purpose
        label: 'Class Name',
        placeholder: 'ModelExample',
        condition: {formats: ['flans_format']}
    });
    new Property(ModelProject, 'string', 'model_short_name', {      //Short Name input field in Project dialog
        label: 'Short Name',
        placeholder: 'example',
        condition: {formats: ['flans_format']},
    });
    new Property(ModelProject, 'string', 'flans_format_type', {      //Selection of Flans type in Project dialog
        label: 'Flan\'s Type',
        default: 'Plane',
        condition: {formats: ['flans_format']},
        options() {
            let options = {}
            for (var key in Codecs.flans_format.templates) {
                if (Codecs.flans_format.templates[key] instanceof Function == false) {
                    options[key] = Codecs.flans_format.templates[key].name;
                }
            }
            return options;
        }
    });

    let flans_format_type_old = '';      //Save flans type before conversion
    //This method is invoked after the Project settings were updated
    Blockbench.on('update_project_settings', onProjectConfirm);
    function onProjectConfirm() {
        if (Format.id === 'flans_format') {
            if (flans_format_type_old === '') {
                flans_format_type_old = Project.flans_format_type;
            }
            //Only make it possible to change the vehicle type if no cubes have yet been created
            if(Outliner.root.length === 0 || Project.flans_format_type === flans_format_type_old) {
                let parts = Templates[Project.flans_format_type]['parts'];   //Get the parts names for the requested Flan's type
                for(let groupName of parts) {       //Loop through the array and create new groups accordingly
                    new Group({
                        name: groupName
                    }).init();
                }
            } else {
                alert('There is already some model loaded. Conversion is not possible due to name conflicts.');
                Project.flans_format_type = flans_format_type_old;
            }
        }
    }
    //Create the export action
    let exportAction = new Action({
        id: 'export_flans_format',
        name: 'Export Flans Model',
        icon: 'fas.fa-jet-fighter',
        category: 'file',
        condition: () => Format == format,
        click: function () {
            codec.export();
        }
    })
    //Add the export action to the menu bar so it can be clicked on
    MenuBar.addAction(exportAction, "file.export");
})();
