/// <reference path="C:\Users\Ian\Documents\Visual Studio 2010\Projects\DA\DA\scripts\map.js" />

define("application/grid", [
    "dojo/_base/declare",
    "dojo/promise/all",
    "dojo/_base/Deferred",
    "dojo/request",
	"dojo/on",
    "dojo/store/JsonRest",
    "dojo/store/Memory",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/ColumnHider",
    "dgrid/extensions/DijitRegistry",
    "dgrid/extensions/ColumnResizer",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/layout/ContentPane",
    "dojo/json",
    "dojo/dom",
    "dojo/_base/lang",
    //"dojo/dom-attr",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/domReady!"
], function (declare, all, Deferred, request, on, JsonRest, Memory, OnDemandGrid, ColumnHider, DijitRegistry, ColumnResizer, Select, Button, ContentPane, JSON, dom, lang, Query, QueryTask ) {

    var server = "http://yt.ento.vt.edu";
    var appURL = "/SlowTheSpread";
    var queryTask, query;
    //Static methods
    var getText = function (node) {
        var text;
        if (node.innerText) {
            text = node.innerText;
        } else {
            text = node.textContent;
        }
        return text;
    };

    var getHeaders = function (obj) {
        var cols = "{";
        for (var key in obj) {
            cols += '"' + key + '": "' + key + '", ';
        }
        cols = cols.substring(0, cols.length - 2);
        cols += "}";
        return JSON.parse(cols);
    };

    return declare(null, {
        reportStateSelect: null,
        reportYearSelect: null,
        reportSelect: null,
        reportDownload: null,
        grid: null,
        restStore: null,
        stateStore: null,
        yearStore: null,
        memStore: null,
        maps: [],

        getYears: function () {
            var d = new Deferred();
            that = this;
            request(server + appURL + "/CatchYears?format=json", {
                handleAs: "json"
            }).then(function (response) {
                that.reportYearSelect = new Select({
                    id: "reportYearSelect",
                    labelAttr: "label",
                    options: response
                }, "reportYearSelect");
                d.resolve();
            }, function (err) {
                console.log(err);
            });
            return d.promise;
        },

        getStates: function () {
            var d = new Deferred();
            var that = this;
            request(server + appURL + "/States?format=json", {
                handleAs: "json"
            }).then(function (response) {
                var optionAll = { value: "", label: "All", selected: false };
                response.unshift(optionAll);
                that.reportStateSelect = new Select({
                    id: "reportStateSelect",
                    labelAttr: "label",
                    options: response
                }, "reportStateSelect");
                d.resolve();
            }, function (err) {
                console.log(err);
            });
            return d.promise;
        },

        getReports: function () {
            var that = this;
            that.reportSelect = new Select({
                id: "reportSelect",
                labelAttr: "label",
                options: [
                    { value: "treatmentEvaluation", label: "Treatment Evaluation" },
                    { value: "treatmentEvaluationDetail", label: "Treatment Evaluation Detail" },
                    { value: "treatmentEvaluationTrapDetail", label: "Trap-Based Treatment Evaluation Detail" },
                    { value: "treatmentEvaluationComparison", label: "Treatment Evaluation Comparison" },
                    { value: "treatmentEvaluationStats", label: "Treatment Evaluation Stats (Raw)" }
                ]
            }, "reportSelect");
            //that.reportSelect.on("change", that.update);
        },

        createDownloadButton: function() {
            var that = this;
            that.reportDownload = new Button({id:"reportDownload", label:"Download"}, "reportDownload");
        },

        update: function () {
            var that = this;
            //dojo.byId("treatGrid").style.cursor = "wait";
            var baseUrl = server + appURL;
            var state = this.reportStateSelect.get("displayedValue");
            var report = this.reportSelect.get("value");
            var year = this.reportYearSelect.get("displayedValue");

            if (state === "All") {
                state = "";
            }

            var url = baseUrl + "/" + report + "/" + year + "/" + state + "?format=json";

            this.restStore = new JsonRest({ target: url, idProperty: "id" });
            this.restStore.query().then(function (response) {
                that.memStore.setData(response.slice(0));

                //Make columns
                var cols;
                if (response.length > 0) {
                    cols = getHeaders(response[0]);
                }

                that.grid.set("columns", cols);

                // Formatting for PPAs / Treatments
                if (report.toUpperCase() === "TREATMENTS" || report.toUpperCase().match(/TREATMENTEVALUATION(DETAIL|TRAPDETAIL|STATS|COMPARISON)?/g)) {
                    that.grid.columns.blockname.renderCell = function (object, value, node, options) {
                        node.innerHTML = "<a href='javascript:;'>" + value + "</a>";
                    }
                    /*on(that.grid, ".field-blockname:click", function (evt) {
                        var cell = that.grid.cell(evt);
                        if (cell.element.getAttribute("role") === 'gridcell') {
                            that.queryActionsById(getText(cell.element));
                        }
                    });*/
                }

                that.grid.set("store", that.memStore);
                that.grid.refresh();
                //dojo.byId("treatGrid").style.cursor = "default";
            });
        },

        constructor: function (maps) {

            var that = this;

            this.maps = maps;

            this.content = new ContentPane({
                id: "gridContent",
                style: "height: 100%"
            }, "reports");

            this.memStore = new Memory();

            this.createDownloadButton();
            this.getReports();
            this.grid = new (declare([OnDemandGrid, DijitRegistry, ColumnHider, ColumnResizer]))({
                id: "grid",
                loadingMessage: "Loading...",
                noDataMessage: "No results found."
            }, "treatGrid");
            on(this.grid, ".field-blockname:click", function (evt) {
                var cell = that.grid.cell(evt);
                if (cell.element.getAttribute("role") === 'gridcell') {
                    that.queryActionsById(getText(cell.element));
                }
            });

            on(dom.byId("forward"), "click", function(evt) {
                that.changeYear(1);
            });

            on(dom.byId("back"), "click", function(evt) {
                that.changeYear(-1);
            });

            on(dom.byId("prevForward"), "click", function(evt) {
                that.changePrevYear(1);
            });

            on(dom.byId("prevBack"), "click", function(evt) {
                that.changePrevYear(-1);
            });

            var states = this.getStates();
            var years = this.getYears();
            all({ years: years, states: states }).then(function (result) {
                that.content.addChild(that.reportYearSelect);
                that.content.addChild(that.reportStateSelect);
                that.content.addChild(that.reportSelect);
                that.content.addChild(that.reportDownload);
                that.content.addChild(that.grid);
                that.content.startup();
                var updateThis = lang.hitch(that, that.update);
                on(that.reportSelect, "change", updateThis);
                on(that.reportYearSelect, "change", function(){updateThis(); that.updateLayers()});
                on(that.reportStateSelect, "change", updateThis);
                on(that.reportDownload, "click", function(){that.downloadReport()});
                updateThis();
                that.updateLayers();

            });
        },

        updateLayers: function(){
            var treatYr = Number(this.reportYearSelect.get("displayedValue"));
            for (var i = 0; i < this.maps.length; i++) {
                var displayYr = treatYr + (i-1);
                var map = this.maps[i].map;
                this.setLayerDefs(map, treatYr, displayYr);
            }
        },

        changeYear: function(chg){
            var treatYr = Number(this.reportYearSelect.get("displayedValue"));
            var maxYr = Number(this.reportYearSelect.options[0].label) + 1;
            var displayYr = Number(dom.byId("map_2_year").innerHTML) + chg;
            if (displayYr <= treatYr || displayYr > maxYr) {
                return;
            }
            var map = this.maps[2].map;
            this.setLayerDefs(map, treatYr, displayYr);
        },

        changePrevYear: function(chg){
            var treatYr = Number(this.reportYearSelect.get("displayedValue"));
            var minYr = Number(this.reportYearSelect.options[this.reportYearSelect.options.length - 1].label);
            var displayYr = Number(dom.byId("map_0_year").innerHTML) + chg;
            if (displayYr >= treatYr || displayYr < minYr) {
                return;
            }
            var map = this.maps[0].map;
            this.setLayerDefs(map, treatYr, displayYr);
        },

        setLayerDefs: function(map, trtYr, dispYr) {
            var max = Number(this.reportYearSelect.options[0].label);
            //var layer = map.getLayer(map.layerIds[1]);
            //alert(map.layerIds);
            //alert(map.basemapLayerIds);
            var layerDef = [];
            layerDef[0] = "YEAR = " + dispYr;
            layerDef[1] = "YEAR = " + dispYr;
            layerDef[2] = "YEAR = " + trtYr;
            layerDef[3] = "YEAR = " + trtYr;
            layerDef[4] = "YEAR = " + dispYr;
            layerDef[5] = "YEAR = " + dispYr;
            map.fLayer.setLayerDefinitions(layerDef);
            //var krig = map.getLayer(map.layerIds[0]);
            var visible = max - dispYr; //this.reportYearSelect.options["2013"].value;
            map.krig.setVisibleLayers([visible]);
            dom.byId(map.id + "_year").innerHTML = dispYr;
            dom.byId(map.id + "_t").innerHTML = dispYr - trtYr === 0 ? " (T)" : " (T" + (dispYr-trtYr) + ")";
        },

        queryActionsById: function (id) {
            if (this.maps && this.maps.length === 0) {
                return;
            } else {
                var map = this.maps[1].map;
                //var layer = map.getLayer(map.layerIds[1]);
                //var that = this;
                var url = map.fLayer.url + "/2"// + this.reportYearSelect.value;
                queryTask = new QueryTask(url);
                query = new Query();
                query.returnGeometry = true;
                query.where = "BLOCKNAME = '" + id + "' AND YEAR = '" + this.reportYearSelect.get("displayedValue") + "'";
                queryTask.execute(query, function (results) {
                    map.setExtent(results.features[0].geometry.getExtent().expand(2));
                });
            }//var deferred = new dojo.DeferredList(qList);
            //deferred.then(map.setExtent(results[0][1].features[0].geometry.getExtent().expand(2)););
        },

        downloadReport: function () {

            //dojo.byId("treatGrid").style.cursor = "wait";
            var state = this.reportStateSelect.get("displayedValue");
            var report = this.reportSelect.get("value");
            var year = this.reportYearSelect.get("displayedValue");

            if (state === "All") {
                state = "";
            }

            var url = server + appURL + "/" + report + "/" + year + "/" + state + "?format=csv";

            var iframe = document.getElementById('downloadFrame');
            if (iframe === null){
                iframe = document.createElement('iframe');
                iframe.id = 'downloadFrame';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = url;

        }

    });
});