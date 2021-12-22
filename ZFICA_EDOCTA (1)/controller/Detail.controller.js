/*global location */
sap.ui.define([
	"ean/edu/co/edo/cta/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ean/edu/co/edo/cta/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("ean.edu.co.edo.cta.controller.Detail", {
		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this._sortFacturas = true;
			this._sortingValue = true;
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			var o = {
				bSuppressBookmarkButton: true
			};
			//this.setHeaderFooterOptions(o);
		},
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.sTitle = oEvent.getParameter("arguments").titulo;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("ListSet", {
					IdList: sObjectId
				});
				this._bindView("/" + sObjectPath);
				this.getView().byId("lineItemsHeader").setText(this.sTitle);
			}.bind(this));
		},
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.IdList,
				sObjectName = oObject.TxtList,
				oViewModel = this.getModel("detailView");
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},
		_onMetadataLoaded: function() {
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			oLineItemTable.attachEventOnce("updateFinished", function() {
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		sortFecha: function(oEvent) {
			var oView = this.getView();
			var oTable = oView.byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			oBinding.sort(new sap.ui.model.Sorter("Budat", this._sortingFecha));
			this._sortingFecha = !this._sortingFecha;
		},
		sortDocumento : function (oEvent){
			var oView = this.getView();
			var oTable = oView.byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			oBinding.sort(new sap.ui.model.Sorter("Opbel", this._sortingDoc));
			this._sortingDoc = !this._sortingDoc;
		},
		sortValor: function(oEvent) {
			var oView = this.getView();
			var oTable = oView.byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			oBinding.sort(new sap.ui.model.Sorter("Betrh", this._sortingValue));
			this._sortingValue = !this._sortingValue;
		}
	});
});