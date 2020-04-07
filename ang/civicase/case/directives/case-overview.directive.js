(function (angular, $, _) {
  var module = angular.module('civicase');

  module.directive('civicaseCaseOverview', function () {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: '~/civicase/case/directives/case-overview.directive.html',
      controller: civicaseCaseOverviewController,
      scope: {
        caseFilter: '<',
        linkToManageCase: '='
      },
      link: civicaseCaseOverviewLink
    };

    /**
     * Link function for civicaseCaseOverview
     *
     * @param {object} $scope scope object
     * @param {object} element the directive element
     * @param {object} attrs attributes of the directive
     */
    function civicaseCaseOverviewLink ($scope, element, attrs) {
      (function init () {
        $scope.$watch('showBreakdown', recalculateScrollbarPosition);
      }());

      /**
       * Watchers for showBreakdown variable
       */
      function recalculateScrollbarPosition () {
        $scope.$emit('civicase::custom-scrollbar::recalculate');
      }
    }
  });

  module.controller('civicaseCaseOverviewController', civicaseCaseOverviewController);

  /**
   * Controller for civicaseCaseOverview.
   *
   * @param {object} $scope the controller's $scope object.
   * @param {object} crmApi the crm api service reference.
   * @param {object} BrowserCache the browser cache service reference.
   * @param {object} CaseStatus the case status service reference.
   * @param {object} CaseType the case type service reference.
   */
  function civicaseCaseOverviewController ($scope, crmApi, BrowserCache, CaseStatus, CaseType) {
    var BROWSER_CACHE_IDENTIFIER = 'civicase.CaseOverview.hiddenCaseStatuses';

    $scope.getItemsForCaseType = CaseType.getItemsForCaseType;
    $scope.hiddenCaseStatuses = {};
    $scope.summaryData = [];
    $scope.caseStatuses = _.chain(CaseStatus.getAll())
      .sortBy(function (status) { return status.weight; })
      .indexBy('weight')
      .value();

    (function init () {
      getCaseTypes();
      // We hide the breakdown when there's only one case type
      if ($scope.caseTypesLength < 2) {
        $scope.showBreakdown = false;
      }

      $scope.$watch('caseFilter', caseFilterWatcher, true);
      loadHiddenCaseStatuses();
    }());

    /**
     * Checks if all statuses are hidden
     *
     * @returns {boolean} true when all statuses are hidden.
     */
    $scope.areAllStatusesHidden = function () {
      return _.filter($scope.caseStatuses, function (status) {
        return !status.isHidden;
      }).length === 0;
    };

    /**
     * Toggle status visibility.
     *
     * @param {document#event:mousedown} $event the toggle DOM event.
     * @param {number} caseStatusId the id for the case status to hide or show.
     */
    $scope.toggleStatusVisibility = function ($event, caseStatusId) {
      $scope.hiddenCaseStatuses[caseStatusId] = !$scope.hiddenCaseStatuses[caseStatusId];

      storeHiddenCaseStatuses();
      $event.stopPropagation();
    };

    /**
     * Toggles the visibility of the breakdown dropdown
     */
    $scope.toggleBrekdownVisibility = function () {
      $scope.showBreakdown = !$scope.showBreakdown;
    };

    /**
     * Watcher function for caseFilter
     */
    function caseFilterWatcher () {
      getCaseTypes();
      loadStatsData();
    }

    /**
     * Loads from the browser cache the ids of the case status that have been
     * previously hidden and marks them as such.
     */
    function loadHiddenCaseStatuses () {
      var hiddenCaseStatusesIds = BrowserCache.get(BROWSER_CACHE_IDENTIFIER, []);
      $scope.hiddenCaseStatuses = {};

      _.forEach(hiddenCaseStatusesIds, function (caseStatusId) {
        $scope.hiddenCaseStatuses[caseStatusId] = true;
      });
    }

    /**
     * Loads Stats data
     */
    function loadStatsData () {
      var apiCalls = [];

      var params = angular.copy($scope.caseFilter || {});
      // status id should not be added to getstats,
      // because case overview section shows all statuses
      delete params.status_id;

      apiCalls.push(['Case', 'getstats', params]);
      crmApi(apiCalls).then(function (response) {
        $scope.summaryData = response[0].values;
      });
    }

    /**
     * Get Case Types based on filters
     *
     * @returns {Promise} promise
     */
    function getCaseTypes () {
      var params = {
        sequential: 1,
        case_type_category: $scope.caseFilter['case_type_id.case_type_category'],
        id: $scope.caseFilter.case_type_id,
        is_active: 1
      };

      return crmApi('CaseType', 'get', params)
        .then(function (data) {
          $scope.caseTypes = data.values;
          $scope.caseTypesLength = _.size($scope.caseTypes);
          $scope.$emit('civicase::custom-scrollbar::recalculate');
        });
    }

    /**
     * Stores in the browser cache the id values of the case statuses that have been
     * hidden.
     */
    function storeHiddenCaseStatuses () {
      var hiddenCaseStatusesIds = _.chain($scope.hiddenCaseStatuses)
        .pick(function (caseStatusIsHidden) {
          return caseStatusIsHidden;
        })
        .keys()
        .value();

      BrowserCache.set(BROWSER_CACHE_IDENTIFIER, hiddenCaseStatusesIds);
    }
  }
})(angular, CRM.$, CRM._);
