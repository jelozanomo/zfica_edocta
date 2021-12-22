sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		dateValue: function(sValue) {
			if (!sValue) {
				return "";
			}
			var d = new Date(sValue),
				month = '' + (d.getMonth() + 1),
				day = '' + (d.getDate() + 1),
				year = d.getFullYear();
			if (month.length < 2) {
				month = '0' + month;
			}
			if (day.length < 2) {
				day = '0' + day;
			}
			return day + "." + month + "." + year;
		},
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}
			//sValue = parseFloat(sValue).toFixed(0);
			var n = sValue.toString(),
				p = n.indexOf('.');
			return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i) {
				return p < 0 || i < p ? ($0 + '.') : $0;
			});
			//return (parseFloat(sValue).toFixed(0)).toLocaleString('en');
		},
		currencyFormateador: function(sValue) {
			if (!sValue) {
				return "";
			}
			var formatter1 = new Intl.NumberFormat('es-CO', {
				style: 'currency',
				minimumFractionDigits: 0
			});
			return formatter1.format(oData.results[oData.results.length - 1].sValue);
		}

	};

});