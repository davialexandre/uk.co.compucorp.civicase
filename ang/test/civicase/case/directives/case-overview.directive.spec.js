/* eslint-env jasmine */
(function ($, _) {
  describe('CaseOverview', function () {
    var $compile, $provide, $q, $rootScope, $scope, BrowserCache,
      CasesOverviewStats, crmApi, element, targetElementScope,
      CaseStatus, CaseType;

    beforeEach(module('civicase.data', 'civicase', 'civicase.templates', function (_$provide_) {
      $provide = _$provide_;
    }));

    beforeEach(inject(function (_$compile_, _$q_, _$rootScope_, BrowserCacheMock,
      _crmApi_, _CasesOverviewStatsData_, _CaseStatus_, _CaseType_) {
      $compile = _$compile_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      crmApi = _crmApi_;
      CasesOverviewStats = _CasesOverviewStatsData_.get();
      BrowserCache = BrowserCacheMock;
      CaseStatus = _CaseStatus_;
      CaseType = _CaseType_;

      BrowserCache.get.and.returnValue([1, 3]);
      $provide.value('BrowserCache', BrowserCache);
      crmApi.and.returnValue($q.resolve([CasesOverviewStats]));
    }));

    beforeEach(function () {
      $scope.caseStatuses = CaseStatus.getAll();
      $scope.summaryData = [];
    });

    beforeEach(function () {
      listenForCaseOverviewRecalculate();
      compileDirective({});
    });

    describe('compile directive', function () {
      it('should have class civicase__case-overview-container', function () {
        expect(element.html()).toContain('civicase__case-overview-container');
      });
    });

    describe('Case Types', function () {
      beforeEach(function () {
        crmApi.and.returnValue($q.resolve([CasesOverviewStats]));
        compileDirective({ caseTypeCategory: 'cases', caseTypeID: [1, 2] });
      });

      it('fetches the active case types', function () {
        expect(crmApi).toHaveBeenCalledWith('CaseType', 'get', {
          sequential: 1,
          case_type_category: 'cases',
          id: [1, 2],
          is_active: 1
        });
      });
    });

    describe('Case Status Data', function () {
      beforeEach(function () {
        crmApi.and.returnValue($q.resolve([CasesOverviewStats]));
        compileDirective({
          caseTypeCategory: 'cases',
          caseTypeID: [1, 2],
          status_id: '1'
        });
      });

      it('fetches the case statistics, but shows all case statuses', function () {
        expect(crmApi).toHaveBeenCalledWith([['Case', 'getstats', {
          'case_type_id.case_type_category': 'cases',
          case_type_id: [1, 2]
        }]]);
      });
    });

    describe('Case Statuses', () => {
      let expectedCaseStatuses;

      describe('when loading a subset of case types', () => {
        beforeEach(() => {
          const sampleCaseStatuses = _.sample(CaseStatus.getAll(), 2);
          const sampleCaseTypes = _.sample(CaseType.getAll(), 2);

          sampleCaseTypes[0].definition.statuses = [sampleCaseStatuses[0].name];
          sampleCaseTypes[1].definition.statuses = [sampleCaseStatuses[1].name];

          expectedCaseStatuses = _.chain(sampleCaseStatuses)
            .sortBy('weight')
            .indexBy('value')
            .value();

          crmApi.and.callFake((entity) => {
            const response = entity === 'CaseType'
              ? { values: sampleCaseTypes }
              : [CasesOverviewStats];

            return $q.resolve(response);
          });

          compileDirective({});
        });

        it('only displays the case statuses belonging to the case types subset', () => {
          expect(element.isolateScope().caseStatuses).toEqual(expectedCaseStatuses);
        });
      });

      describe('when loading a case type that supports al statuses', () => {
        beforeEach(() => {
          const allCaseStatuses = CaseStatus.getAll();
          const caseType = _.sample(CaseType.getAll());

          delete caseType.definition.statuses;

          expectedCaseStatuses = _.chain(allCaseStatuses)
            .sortBy('weight')
            .indexBy('value')
            .value();

          crmApi.and.callFake((entity) => {
            const response = entity === 'CaseType'
              ? { values: [caseType] }
              : [CasesOverviewStats];

            return $q.resolve(response);
          });

          compileDirective({});
        });

        it('only displays all case statuses', () => {
          expect(element.isolateScope().caseStatuses).toEqual(expectedCaseStatuses);
        });
      });
    });

    describe('Case Status visibility', function () {
      describe('when the component loads', function () {
        it('requests the case status that are hidden stored in the browser cache', function () {
          expect(BrowserCache.get).toHaveBeenCalledWith('civicase.CaseOverview.hiddenCaseStatuses', []);
        });

        it('hides the case statuses marked as hidden by the browser cache', function () {
          expect(element.isolateScope().hiddenCaseStatuses).toEqual({
            1: true,
            3: true
          });
        });
      });

      describe('when marking a status as hidden', function () {
        beforeEach(function () {
          element.isolateScope().hiddenCaseStatuses = {
            1: true,
            2: false,
            3: true
          };

          element.isolateScope().toggleStatusVisibility($.Event(), 2);
        });

        it('stores the hidden case statuses including the new one', function () {
          expect(BrowserCache.set).toHaveBeenCalledWith('civicase.CaseOverview.hiddenCaseStatuses', ['1', '2', '3']);
        });
      });

      describe('when marking a status as enabled', function () {
        beforeEach(function () {
          element.isolateScope().hiddenCaseStatuses = {
            1: true,
            2: false,
            3: true
          };

          element.isolateScope().toggleStatusVisibility($.Event(), 1);
        });

        it('stores the hidden case statuses including the new one', function () {
          expect(BrowserCache.set).toHaveBeenCalledWith('civicase.CaseOverview.hiddenCaseStatuses', ['3']);
        });
      });
    });

    describe('when showBreakdown is false', function () {
      beforeEach(function () {
        element.isolateScope().showBreakdown = false;
      });

      describe('when toggleBreakdownVisibility is called', function () {
        beforeEach(function () {
          element.isolateScope().toggleBreakdownVisibility();
        });

        it('resets showBreakdown to true', function () {
          expect(element.isolateScope().showBreakdown).toBe(true);
        });
      });
    });

    describe('when showBreakdown is true', function () {
      beforeEach(function () {
        element.isolateScope().showBreakdown = true;
      });

      describe('when toggleBreakdownVisibility is called', function () {
        beforeEach(function () {
          element.isolateScope().toggleBreakdownVisibility();
        });

        it('resets showBreakdown to false', function () {
          expect(element.isolateScope().showBreakdown).toBe(false);
        });
      });
    });

    describe('showBreakdown watcher', function () {
      it('emit called and targetElementScope to be defined', function () {
        expect(targetElementScope).toEqual(element.isolateScope());
      });
    });

    /**
     * Initialise directive.
     *
     * @param {string} params the case type category name.
     */
    function compileDirective (params) {
      $scope.caseFilter = {
        'case_type_id.case_type_category': params.caseTypeCategory,
        case_type_id: params.caseTypeID
      };
      element = $compile('<civicase-case-overview case-filter="caseFilter"></civicase-case-overview>')($scope);
      $scope.$digest();
    }

    /**
     * Listen for `civicase::custom-scrollbar::recalculate` event
     */
    function listenForCaseOverviewRecalculate () {
      $rootScope.$on('civicase::custom-scrollbar::recalculate', function (event) {
        targetElementScope = event.targetScope;
      });
    }
  });
})(CRM.$, CRM._);
