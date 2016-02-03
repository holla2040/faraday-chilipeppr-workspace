/* global cpdefine chilipeppr cprequire */
cprequire_test(["inline:com-hollabaugh-faraday-chilipeppr-workspace"], function(ws) {

    console.log("initting workspace");

    /**
     * The Root workspace (when you see the ChiliPeppr Header) auto Loads the Flash 
     * Widget so we can show the 3 second flash messages. However, in test mode we
     * like to see them as well, so just load it from the cprequire_test() method
     * so we have similar functionality when testing this workspace.
     */
    var loadFlashMsg = function() {
        chilipeppr.load("#com-chilipeppr-widget-flash-instance",
            "http://fiddle.jshell.net/chilipeppr/90698kax/show/light/",
            function() {
                console.log("mycallback got called after loading flash msg module");
                cprequire(["inline:com-chilipeppr-elem-flashmsg"], function(fm) {
                    //console.log("inside require of " + fm.id);
                    fm.init();
                });
            }
        );
    };
    loadFlashMsg();

    // Init workspace
    ws.init();

    // Do some niceties for testing like margins on widget and title for browser
    $('title').html("Faraday Workspace");
    $('body').css('padding', '10px');

} /*end_test*/ );

// This is the main definition of your widget. Give it a unique name.
cpdefine("inline:com-hollabaugh-faraday-chilipeppr-workspace", ["chilipeppr_ready"], function() {
    return {
        /**
         * The ID of the widget. You must define this and make it unique.
         */
        id: "com-hollabaugh-faraday-chilipeppr-workspace", // Make the id the same as the cpdefine id
        name: "Faraday Coil Winder Workspace", // The descriptive name of your widget.
        desc: `Faraday Coil Winder Workspace`,
        url: "(auto fill by runme.js)", // The final URL of the working widget as a single HTML file with CSS and Javascript inlined. You can let runme.js auto fill this if you are using Cloud9.
        fiddleurl: "(auto fill by runme.js)", // The edit URL. This can be auto-filled by runme.js in Cloud9 if you'd like, or just define it on your own to help people know where they can edit/fork your widget
        githuburl: "(auto fill by runme.js)", // The backing github repo
        testurl: "(auto fill by runme.js)", // The standalone working widget so can view it working by itself
        switchesLast:"000>",
        
        /**
         * Contains reference to the Console widget object. Hang onto the reference
         * so we can resize it when the window resizes because we want it to manually
         * resize to fill the height of the browser so it looks clean.
         */
        widgetConsole: null,
        /**
         * Contains reference to the Serial Port JSON Server object.
         */
        widgetSpjs: null,
        /**
         * The workspace's init method. It loads the all the widgets contained in the workspace
         * and inits them.
         */
         self: null,
        init: function() {
            this.switchesLast = "000>";
            // Most workspaces will instantiate the Serial Port JSON Server widget
            this.loadSpjsWidget();
            // Most workspaces will instantiate the Serial Port Console widget
            this.loadConsoleWidget(function() {
                setTimeout(function() {
                    $(window).trigger('resize');
                }, 100);
            });

            //this.loadTemplateWidget();

            // Create our workspace upper right corner triangle menu
            this.loadWorkspaceMenu();
            // Add our billboard to the menu (has name, url, picture of workspace)
            this.addBillboardToWorkspaceMenu();

            // Setup an event to react to window resize. This helps since
            // some of our widgets have a manual resize to cleanly fill
            // the height of the browser window. You could turn this off and
            // just set widget min-height in CSS instead
            this.setupResize();
            setTimeout(function() {
                $(window).trigger('resize');
            }, 100);
            // this.loadXYZWidget();
            // this.loadGRBLWidget();
            
            self = this;
            
            chilipeppr.publish("/com-chilipeppr-widget-serialport/send","$10=19"); // turn on limit sw reporting
            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/recvline",this.statusHandler);
            setInterval(function() {
                chilipeppr.publish("/com-chilipeppr-widget-serialport/send","?");
            },100);

        },
        statusHandler: function(reply){
            $('#mywidget2-instance').text(reply.dataline);
            // <Idle,MPos:0.000,4.000,0.000,WPos:0.000,4.000,0.000,Lim:000>
            if (reply.dataline[0]=='<'){ // 0 is spindle
                var switches = reply.dataline.split(":")[3];
                //console.log(">>>>>>>>>>"+switches+"-----"+self.switchesLast+"))))");
                if ((switches[0]=='1') && (self.switchesLast[0]=='0')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","~g91f25g1y200\n");
                }
                if ((switches[0]=='0') && (self.switchesLast[0] == '1')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","!\n");
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send",String.fromCharCode(24));
                }
                
                if ((switches[1]=='1') && (self.switchesLast[1]=='0')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","~g91f25g1x-100\n");
                }
                if ((switches[1]=='0') && (self.switchesLast[1] == '1')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","!\n");
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send",String.fromCharCode(24));
                }
                
                if ((switches[2]=='1') && (self.switchesLast[2]=='0')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","~g91f25g1x100\n");
                }
                if ((switches[2]=='0') && (self.switchesLast[2] == '1')) {
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send","!\n");
                    chilipeppr.publish("/com-chilipeppr-widget-serialport/send",String.fromCharCode(24));
                }
                
                self.switchesLast = switches;
            }
        },
        /**
         * Returns the billboard HTML, CSS, and Javascript for this Workspace. The billboard
         * is used by the home page, the workspace picker, and the fork pulldown to show a
         * consistent name/image/description tag for the workspace throughout the ChiliPeppr ecosystem.
         */
        getBillboard: function() {
            var el = $('#' + this.id + '-billboard').clone();
            el.removeClass("hidden");
            el.find('.billboard-desc').text(this.desc);
            return el;
        },
        /**
         * Inject the billboard into the Workspace upper right corner pulldown which
         * follows the standard template for workspace pulldown menus.
         */
        addBillboardToWorkspaceMenu: function() {
            // get copy of billboard
            var billboardEl = this.getBillboard();
            $('#' + this.id + ' .com-chilipeppr-ws-billboard').append(billboardEl);
        },
        /**
         * Listen to window resize event.
         */
        setupResize: function() {
            $(window).on('resize', this.onResize.bind(this));
        },
        /**
         * When browser window resizes, forcibly resize the Console window
         */
        onResize: function() {
            if (this.widgetConsole) this.widgetConsole.resize();
        },
        /**
         * Load the Template widget via chilipeppr.load() so folks have a sample
         * widget they can fork as a starting point for their own.
         */
        loadTemplateWidget: function(callback) {

            chilipeppr.load(
                "#com-chilipeppr-widget-template-instance",
                "http://raw.githubusercontent.com/chilipeppr/widget-template/master/auto-generated-widget.html",
                function() {
                    // Callback after widget loaded into #myDivWidgetTemplate
                    // Now use require.js to get reference to instantiated widget
                    cprequire(
                        ["inline:com-chilipeppr-widget-template"], // the id you gave your widget
                        function(myObjWidgetTemplate) {
                            // Callback that is passed reference to the newly loaded widget
                            console.log("Widget / Template just got loaded.", myObjWidgetTemplate);
                            myObjWidgetTemplate.init();
                        }
                    );
                }
            );
        },
        /**
         * Load the Serial Port JSON Server widget via chilipeppr.load()
         */
        loadSpjsWidget: function(callback) {

            var that = this;

            chilipeppr.load(
                "#com-chilipeppr-widget-serialport-instance",
                "http://fiddle.jshell.net/chilipeppr/vetj5fvx/show/light/",
                function() {
                    console.log("mycallback got called after loading spjs module");
                    cprequire(["inline:com-chilipeppr-widget-serialport"], function(spjs) {
                        //console.log("inside require of " + fm.id);
                        spjs.setSingleSelectMode();
                        spjs.init({
                            isSingleSelectMode: true,
                            defaultBuffer: "default",
                            defaultBaud: 115200,
                            bufferEncouragementMsg: 'For your device please choose the "default" buffer in the pulldown and a 115200 baud rate before connecting.'
                        });
                        //spjs.showBody();
                        //spjs.consoleToggle();

                        that.widgetSpjs - spjs;

                        if (callback) callback(spjs);

                    });
                }
            );
        },
        /**
         * Load the Console widget via chilipeppr.load()
         */
        loadConsoleWidget: function(callback) {
            var that = this;
            chilipeppr.load(
                "#com-chilipeppr-widget-spconsole-instance",
                "http://fiddle.jshell.net/chilipeppr/rczajbx0/show/light/",
                function() {
                    // Callback after widget loaded into #com-chilipeppr-widget-spconsole-instance
                    cprequire(
                        ["inline:com-chilipeppr-widget-spconsole"], // the id you gave your widget
                        function(mywidget) {
                            // Callback that is passed reference to your newly loaded widget
                            console.log("My Console widget just got loaded.", mywidget);
                            that.widgetConsole = mywidget;

                            // init the serial port console
                            // 1st param tells the console to use "single port mode" which
                            // means it will only show data for the green selected serial port
                            // rather than for multiple serial ports
                            // 2nd param is a regexp filter where the console will filter out
                            // annoying messages you don't generally want to see back from your
                            // device, but that the user can toggle on/off with the funnel icon
                            that.widgetConsole.init(true, /myfilter/);
                            if (callback) callback(mywidget);
                        }
                    );
                }
            );
        },
        /**
         * Load the workspace menu and show the pubsubviewer and fork links using
         * our pubsubviewer widget that makes those links for us.
         */
        loadWorkspaceMenu: function(callback) {
            // Workspace Menu with Workspace Billboard
            var that = this;
            chilipeppr.load(
                "http://fiddle.jshell.net/chilipeppr/zMbL9/show/light/",
                function() {
                    require(['inline:com-chilipeppr-elem-pubsubviewer'], function(pubsubviewer) {

                        var el = $('#' + that.id + ' .com-chilipeppr-ws-menu .dropdown-menu-ws');
                        console.log("got callback for attachto menu for workspace. attaching to el:", el);

                        pubsubviewer.attachTo(
                            el,
                            that,
                            "Workspace"
                        );

                        if (callback) callback();
                    });
                }
            );
        },

        loadXYZWidget: function(callback) {

            //Axes Widget XYZA
            //This widget is locked at version 97 until upgrades can be tested with the override code.
            chilipeppr.load(
                "com-chilipeppr-xyz",
                "http://fiddle.jshell.net/chilipeppr/gh45j/97/show/light/",

                function() {
                    cprequire(
                        ["inline:com-chilipeppr-widget-xyz"],

                        function(xyz) {
                            //overwrite the G28 homing process with grbl's $H homing
                            var oldHomeAxis = xyz.homeAxis.bind(xyz);
                            var newHomeAxis = function(data) {
                                var cmd = "$H\n";
                                console.log(cmd);
                                chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);

                            };
                            var oldSendDone = xyz.sendDone.bind(xyz);
                            var newSendDone = function(data) {

                            };
                            xyz.homeAxis = newHomeAxis;
                            xyz.sendDone = newSendDone;

                            xyz.updateAxesFromStatus = function(axes) {
                                console.log("updateAxesFromStatus:", axes);

                                var coords = {
                                        x: null,
                                        y: null,
                                        z: null
                                    } //create local object to edit

                                //first, we may need to convert units to match 3d viewer
                                if (axes.unit == "mm" && xyz.currentUnits === "inch") {
                                    coords.x = (axes.x / 25.4).toFixed(3);
                                    coords.y = (axes.y / 25.4).toFixed(3);
                                    coords.z = (axes.z / 25.4).toFixed(3);
                                }
                                else if (axes.unit == "inch" && xyz.currentUnits === "mm") {
                                    coords.x = (axes.x * 25.4).toFixed(3);
                                    coords.y = (axes.y * 25.4).toFixed(3);
                                    coords.z = (axes.z * 25.4).toFixed(3);
                                }
                                else {
                                    coords.x = axes.x;
                                    coords.y = axes.y;
                                    coords.z = axes.z;
                                }

                                if ('x' in coords && coords.x != null) {
                                    xyz.updateAxis("x", coords.x);
                                }
                                if ('y' in coords && coords.y != null) {
                                    xyz.updateAxis("y", coords.y);
                                }
                                if ('z' in coords && coords.z != null) {
                                    xyz.updateAxis("z", coords.z);
                                }
                                if ('a' in coords && coords.a != null) {
                                    xyz.updateAxis("a", coords.a);
                                }
                            };

                            xyz.init();

                            chilipeppr.unsubscribe('/com-chilipeppr-widget-3dviewer/unitsChanged', xyz.updateUnitsFromStatus);

                            //remove wcs until it is fully baked
                            $('.btnToggleShowWcs').hide();
                            xyz.setupShowHideWcsBtn = function() {};

                            $('#com-chilipeppr-widget-xyz-ftr .joggotozero').attr("data-content", "G0 X0 Y0 Z0<br/>If you need to go to X0 Y0 first and then Z0, you can use the menus on the axes above.");

                            //bind the zero out button to G92 instead of G28
                            $('#com-chilipeppr-widget-xyz-ftr .jogzeroout').unbind("click");
                            $('#com-chilipeppr-widget-xyz-ftr .jogzeroout').click("xyz", xyz.zeroOutAxisG92.bind(xyz));
                            $('#com-chilipeppr-widget-xyz-ftr .jogzeroout').attr("data-content", "G92 X0 Y0 Z0 - Temporary offsets will be lost with grbl soft reset (ctrl+x) or when an M2 or M30 command is executed");

                            //update homing pop-up
                            $('#com-chilipeppr-widget-xyz-ftr .joghome').attr("data-content", "$H homing cycle - Must have limit switches and homing enabled in GRBL settings");

                            //clean up drop down lists (z)
                            $("#com-chilipeppr-widget-xyz-z .dropdown-menu li")[9].remove();
                            $("#com-chilipeppr-widget-xyz-z .dropdown-menu li")[8].remove();
                            $("#com-chilipeppr-widget-xyz-z .dropdown-menu li")[4].remove();
                            $("#com-chilipeppr-widget-xyz-z .dropdown-menu li")[3].remove();
                            $("#com-chilipeppr-widget-xyz-z .dropdown-menu li")[2].remove();
                            //clean up drop down lists (y)
                            $("#com-chilipeppr-widget-xyz-y .dropdown-menu li")[9].remove();
                            $("#com-chilipeppr-widget-xyz-y .dropdown-menu li")[8].remove();
                            $("#com-chilipeppr-widget-xyz-y .dropdown-menu li")[4].remove();
                            $("#com-chilipeppr-widget-xyz-y .dropdown-menu li")[3].remove();
                            $("#com-chilipeppr-widget-xyz-y .dropdown-menu li")[2].remove();
                            //clean up drop down lists (x)
                            $("#com-chilipeppr-widget-xyz-x .dropdown-menu li")[9].remove();
                            $("#com-chilipeppr-widget-xyz-x .dropdown-menu li")[8].remove();
                            $("#com-chilipeppr-widget-xyz-x .dropdown-menu li")[4].remove();
                            $("#com-chilipeppr-widget-xyz-x .dropdown-menu li")[3].remove();
                            $("#com-chilipeppr-widget-xyz-x .dropdown-menu li")[2].remove();

                            //remove A axis toggle option
                            $('#com-chilipeppr-widget-xyz .showhideaaxis').remove();

                            //Port the inches/mm code to grbl workspace - change to work with grbl

                            //$('#com-chilipeppr-widget-xyz .btnInMm').unbind("click");
                            //$('#com-chilipeppr-widget-xyz .btnInMm').click(xyz.toggleInMm.bind(xyz));

                            //remove existing keydown/keyup commands for jogging -- will replace these with our own keypress function
                            $('#com-chilipeppr-widget-xyz-ftr').unbind("keydown");
                            $('#com-chilipeppr-widget-xyz-ftr').unbind("keyup");

                            //create the keypress function
                            var that = xyz;
                            $('#com-chilipeppr-widget-xyz-ftr').keydown(function(evt) {
                                if (that.isInCustomMenu) {
                                    console.log("custom menu showing. not doing jog.");
                                    return true;
                                }

                                that.accelBaseValHilite(evt);

                                // if this keydown event does not contain a relevant keypress then just exit
                                if (!(evt.which > 30 && evt.which < 41)) {
                                    console.log("exiting cuz not arrow key. evt:", evt);
                                    return;
                                }
                                else {
                                    //console.log("evt:", evt);
                                }

                                var key = evt.which;
                                var direction = null;

                                if (key == 38) {
                                    // up arrow. Y+
                                    direction = "Y+";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogy').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogy').removeClass('hilite');
                                    }, 100);
                                }
                                else if (key == 40) {
                                    // down arrow. Y-
                                    direction = "Y-";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogyneg').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogyneg').removeClass('hilite');
                                    }, 100);
                                }
                                else if (key == 37) {
                                    direction = "X-";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogxneg').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogxneg').removeClass('hilite');
                                    }, 100);
                                }
                                else if (key == 39) {
                                    direction = "X+";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogx').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogx').removeClass('hilite');
                                    }, 100);
                                }
                                else if (key == 33) {
                                    // page up
                                    direction = "Z+";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogz').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogz').removeClass('hilite');
                                    }, 100);
                                }
                                else if (key == 34) {
                                    // page down
                                    direction = "Z-";
                                    $('#com-chilipeppr-widget-xyz-ftr .jogzneg').addClass("hilite");
                                    setTimeout(function() {
                                        $('#com-chilipeppr-widget-xyz-ftr .jogzneg').removeClass('hilite');
                                    }, 100);
                                }

                                if (direction) {
                                    //that.jog(direction, isFast, is100xFast, is1000xFast, is10000xFast);
                                    that.jog(direction);
                                }
                            });
                            // when key is up, we're done jogging
                            $('#com-chilipeppr-widget-xyz-ftr').keyup(function(evt) {
                                that.accelBaseValUnhilite();
                            });
                        });
                });
        },

        loadGRBLWidget: function(callback) {
            // GRBL
            // http://jsfiddle.net/jarret/b5L2rtgc/ //alternate test version of grbl controller
            // com-chilipeppr-grbl
            chilipeppr.load(
                "com-chilipeppr-grbl",
                "http://fiddle.jshell.net/jarret/9aaL8jg4/show/light/",

                function() {
                    cprequire(
                        ["inline:com-chilipeppr-widget-grbl"], //"inline:com-chilipeppr-widget-spconsole"],
                        //, "inline:com-chilipeppr-serialport-spselector"],

                        function(grbl) { //,spconsole) {

                            grbl.init();

                        });
                });
        }

    }

});