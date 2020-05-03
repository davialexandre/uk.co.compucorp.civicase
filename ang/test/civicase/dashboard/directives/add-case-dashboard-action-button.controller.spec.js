/* eslint-env jasmine */

(($) => {
  describe('AddCaseDashboardActionButtonController', () => {
    let $rootScope, $scope, $controller, AddCase, currentCaseCategory;

    beforeEach(module('civicase-base', 'civicase'));

    describe('Button Visibility', () => {
      beforeEach(() => {
        injectDependencies();
        spyOn(AddCase, 'isVisible');
        initController();

        $scope.isVisible();
      });

      it('displays the Add Case button only when adequate permission is available', () => {
        expect(AddCase.isVisible).toHaveBeenCalled();
      });
    });

    describe('Click Event', () => {
      beforeEach(() => {
        injectDependencies();
        spyOn(AddCase, 'clickHandler');
        initController();

        $scope.clickHandler();
      });

      it('creates a new case', () => {
        expect(AddCase.clickHandler).toHaveBeenCalledWith({
          caseTypeCategoryName: currentCaseCategory
        });
      });
    });

    /**
     * Initializes the contact case tab case details controller.
     */
    function initController () {
      $scope = $rootScope.$new();

      $controller('AddCaseDashboardActionButtonController', { $scope: $scope });
    }

    /**
     * Injects and hoists the dependencies used by this spec file.
     */
    function injectDependencies () {
      inject((_$location_, _$rootScope_, _$controller_, _AddCase_,
        _currentCaseCategory_) => {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        AddCase = _AddCase_;
        currentCaseCategory = _currentCaseCategory_;
      });
    }
  });
})(CRM.$);
