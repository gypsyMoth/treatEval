/*
Define the clickLegend module using "define" to load the necessary modules. 
See documentation here: "http://dojotoolkit.org/documentation/tutorials/1.8/modules/" for more information.
This includes standard dojo modules as well as custom modules included with the application.
*/

// Last updated 12/19/2014

define(["dojo/_base/declare", "dijit/Menu", "dijit/CheckedMenuItem"],
	
	function(declare, Menu, CheckedMenuItem){
		// Create an object to declare the class and its properties and/or methods.
		var legend = declare(null, {

			mapItems: [],
			//Create a method called "setLayers" used to set the layers displayed in the legend.
			setLayers: function(url){

				var that = this;

				var map = that.mapItems[2].map
				//var fLayer = map.getLayer(map.layerIds[1]);

				var checkKrig = new CheckedMenuItem({
					id: "krig_check",
					label: "Treatment Krig",
					style: "vertical-align:top;",
					// Create the onChange function. It uses an array to hold the current visible layers
					// in the global fLayer. It then determines the new value of "checked" and adds or removes
					// the current layerId from the visible layers array.
					onChange: function () {
						for (var i = 0; i < that.mapItems.length; i++) {
							var map = that.mapItems[i].map;
							//var layer = map.getLayer(map.layerIds[1]);
							//var visible = map.fLayer.visibleLayers;
							if (this.checked == true) {
								map.krig.setVisibility(true);
								//visible.push(parseInt(this.id));
							}
							else {
								//visible.splice(visible.indexOf(parseInt(this.id)), 1);
								//if (visible.length < 1) {
								map.krig.setVisibility(false);
								//}
							}
							// Set the visibleLayers property of fLayer equal to the array of visible layers.
							//map.fLayer.setVisibleLayers(visible);
						}
					}
				});

				// Create a menu object to hold the menu items in the "layersPane"	
				var legendMenu = new Menu({style:"border: none; margin:20px;"});
				
				// Set the url for the JSON legend at the REST endpoint.
				var legendUrl = url + "/legend?f=pjson";
				
				// Create an XMLHttpRequest in order to pull the JSON object from the REST endpoint
				var legendHTML = null;
				legendHTML = new XMLHttpRequest();
				legendHTML.open("GET", legendUrl, true);
				legendHTML.send(null);
				// Once the request is returned, parse the JSON and loop through the layers.
				legendHTML.onload = function(){
					var legendJSON = JSON.parse(legendHTML.responseText);
					dojo.forEach(legendJSON.layers, function(layer){
						var html;
						// Use a conditional statement to skip over layers that have a "legend" array length equal to one, meaning they use a single feature symbology.
						if (layer.legend.length == 1){
							// Set the legend symoblogy image url
							var img = url+ "/" + layer.layerId + "/images/" + layer.legend[0].url;	
							// Create the html for the symbology image
							var imgHTML = "<img src='" + img + "'></img>  ";
							// Create the html for the label
   							var lbl = layer.layerName;
  							var lblHTML = "<span style='vertical-align:top;'>" + lbl + "</span>";
							html = imgHTML + lblHTML;
						}
						// Repeat the process above for any layers that have a JSON legend array with more than one symbol, meaning those that use a categorized symbology 
						else {
							// Create the layer name heading html
							html = "<span style='vertical-align:top;'><b>" + layer.layerName + "</b></span><br>";
							dojo.forEach(layer.legend, function(item){
								var img = url + "/" + layer.layerId + "/images/" + item.url;
								var imgHTML = "<img src='" + img + "'></img>&nbsp;";
								var lbl = item.label;
								var lblHTML = "<span style='vertical-align:top;'>" + lbl + "</span><br>";
								// Combine the layer heading, image, and label html
								html = html + imgHTML + lblHTML;
							});
							//html = categoryHTML;
						}
						var checkItem = new CheckedMenuItem({
							id: layer.layerId + "_check",
							label: html,
							style: "vertical-align:top;",
							// Create the onChange function. It uses an array to hold the current visible layers
							// in the global fLayer. It then determines the new value of "checked" and adds or removes
							// the current layerId from the visible layers array.
                            onChange: function() {
								for (var i = 0; i < that.mapItems.length; i++) {
									var map = that.mapItems[i].map;
									//var layer = map.getLayer(map.layerIds[1]);
									var visible = map.fLayer.visibleLayers;
									if (this.checked == true) {
										map.fLayer.setVisibility(true);
										visible.push(parseInt(this.id));
									}
									else {
										visible.splice(visible.indexOf(parseInt(this.id)), 1);
										if (visible.length < 1) {
											map.fLayer.setVisibility(false);
										}
									}
									// Set the visibleLayers property of fLayer equal to the array of visible layers.
									map.fLayer.setVisibleLayers(visible);
								}
							}
						});
						if (map.fLayer.layerInfos[layer.layerId].defaultVisibility === true){
							checkItem.attr('checked', true);
						} else {
							checkItem.attr('checked', false);
						}
						// Add the checked menu item to the menu
						legendMenu.addChild(checkItem);

					});
					legendMenu.addChild(checkKrig);
				};

				// Krig is on a 10.0 server that doesn't support legend JSON - skipping legend for now...

				/*var krigHTML = new XMLHttpRequest();
				alert(map.krig.url + "/legend?f=pjson");
				krigHTML.open("GET", map.krig.url + "/legend?f=pjson", true);
				krigHTML.send(null);
				// Once the request is returned, parse the JSON and loop through the layers.
				krigHTML.onload = function(){
					alert("CHECK!");
					var krigJSON = JSON.parse(krigHTML.responseText);
					var krigLayer = krigJSON.layers[0];
					alert(JSON.stringify(krigLayer));
					var html= "<span style='vertical-align:top;'><b>" + krigLayer.layerName + "</b></span><br>";
					dojo.forEach(krigLayer.legend, function(item){
						var img = url + "/" + krigLayer.layerId + "/images/" + item.url;
						var imgHTML = "<img src='" + img + "'></img>&nbsp;";
						var lbl = item.label;
						var lblHTML = "<span style='vertical-align:top;'>" + lbl + "</span><br>";
						// Combine the layer heading, image, and label html
						html = html + imgHTML + lblHTML;
					});
					var checkKrig = new CheckedMenuItem({
						id: "krig_check",
						label: html,
						style: "vertical-align:top;",
						// Create the onChange function. It uses an array to hold the current visible layers
						// in the global fLayer. It then determines the new value of "checked" and adds or removes
						// the current layerId from the visible layers array.
						onChange: function () {
							for (var i = 0; i < that.mapItems.length; i++) {
								var map = that.mapItems[i].map;
								//var layer = map.getLayer(map.layerIds[1]);
								//var visible = map.fLayer.visibleLayers;
								if (this.checked == true) {
									map.krig.setVisibility(true);
									//visible.push(parseInt(this.id));
								}
								else {
									//visible.splice(visible.indexOf(parseInt(this.id)), 1);
									//if (visible.length < 1) {
										map.krig.setVisibility(false);
									//}
								}
								// Set the visibleLayers property of fLayer equal to the array of visible layers.
								//map.fLayer.setVisibleLayers(visible);
							}
						}
					});
				};*/




				legendMenu.placeAt("featurePane");
				// Set the returned object to be the menu object
				//return legendMenu;
			}
		});
		// Set the returned object to be the declared class object
		return legend;
	}
);