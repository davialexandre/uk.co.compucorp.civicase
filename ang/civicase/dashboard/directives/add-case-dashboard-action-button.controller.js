(function (_, angular, checkPerm, loadForm, getCrmUrl) {
  var module = angular.module('civicase');

  module.controller('AddCaseDashboardActionButtonController', AddCaseDashboardActionButtonController);

  /**
   * Add Case Dashboard Action Button Controller
   *
   * @param {object} $scope scope object
   * @param {object} ts ts
   * @param {object} AddCase Add Case Service
   * @param {string} currentCaseCategory the current case category name
   */
  function AddCaseDashboardActionButtonController ($scope, ts, AddCase,
    currentCaseCategory) {
    $scope.ts = ts;

    $scope.clickHandler = clickHandler;
    $scope.isVisible = AddCase.isVisible;

    /**
     * Click handler for the Add Case Dashboard button.
     */
    function clickHandler () {
      AddCase.clickHandler({
        caseTypeCategoryName: currentCaseCategory
      });
    }
  }
})(CRM._, angular, CRM.checkPerm, CRM.loadForm, CRM.url);
