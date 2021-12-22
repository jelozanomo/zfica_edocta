/*global history */
sap.ui.define([
	"ean/edu/co/edo/cta/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"ean/edu/co/edo/cta/model/formatter",
	"ean/edu/co/edo/cta/model/grouper",
	"ean/edu/co/edo/cta/model/GroupSortState"
], function(BaseController, JSONModel, History, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, grouper, GroupSortState) {
	"use strict";

	return BaseController.extend("ean.edu.co.edo.cta.controller.Master", {

		formatter: formatter,
		onInit: function() {
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();
			this._oGroupSortState = new GroupSortState(oViewModel, grouper.groupUnitNumber(this.getResourceBundle()));
			this._oList = oList;
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};
			this.setModel(oViewModel, "masterView");
			oList.attachEventOnce("updateFinished", function() {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

		},
		obtenerTotal: function() {
			var oModel = this.getView().getModel();
			var that = this;
			oModel.read("/TotalSet", {
				success: function(oData, oResponse) {
					sap.ui.core.BusyIndicator.hide();
					var oPrimEvent = oData.results[0];
					var oHTotal = that.getView().byId("oHTotal");
					oPrimEvent.Betrh = parseFloat(oPrimEvent.Betrh).toFixed(0);
					var n = oPrimEvent.Betrh.toString(),
					p = n.indexOf('.');
					n = n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i) {
						return p < 0 || i < p ? ($0 + '.') : $0;
					});

				//	oHTotal.setNumber(oPrimEvent.Betrh);
				oHTotal.setNumber(n);
					oHTotal.setNumberUnit(oPrimEvent.Waers);
				},
				error: function(oData, oResponse) {
					that.showDialog("Error leyendo datos de los eventos");
				}
			});
		},
		onUpdateFinished: function(oEvent) {
			this._updateListItemCount(oEvent.getParameter("total"));
			this.byId("pullToRefresh").hide();
			this.obtenerTotal();
		},

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
				return;
			}
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("TxtList", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();
		},

		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		onSort: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey(),
				aSorters = this._oGroupSortState.sort(sKey);

			this._applyGroupSort(aSorters);
		},

		onGroup: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey(),
				aSorters = this._oGroupSortState.group(sKey);

			this._applyGroupSort(aSorters);
		},

		onOpenViewSettings: function() {
			if (!this._oViewSettingsDialog) {
				this._oViewSettingsDialog = sap.ui.xmlfragment("ean.edu.co.edo.cta.view.ViewSettingsDialog", this);
				this.getView().addDependent(this._oViewSettingsDialog);
				// forward compact/cozy style into Dialog
				this._oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
			this._oViewSettingsDialog.open();
		},

		onConfirmViewSettingsDialog: function(oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];
			aFilterItems.forEach(function(oItem) {
				switch (oItem.getKey()) {
					case "Filter1":
						aFilters.push(new Filter("Betrh", FilterOperator.LE, 100));
						break;
					case "Filter2":
						aFilters.push(new Filter("Betrh", FilterOperator.GT, 100));
						break;
					default:
						break;
				}
				aCaptions.push(oItem.getText());
			});
			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
		},

		onSelectionChange: function(oEvent) {
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "TxtList",
				groupBy: "None"
			});
		},

		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}

					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("IdList");
					var tituloConcepto = mParams.firstListitem.getBindingContext().getProperty("title");
					if (tituloConcepto === undefined || tituloConcepto === null || tituloConcepto === "") {
						tituloConcepto = " ";
					}
					this.getRouter().navTo("object", {
						objectId: sObjectId,
						titulo: tituloConcepto
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			var tituloConcepto = oItem.getProperty("title");
			if (tituloConcepto === null || tituloConcepto === "") {
				tituloConcepto = "noTitle";
			}
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("IdList"),
				titulo: tituloConcepto
			}, bReplace);
		},

		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}

	});

});