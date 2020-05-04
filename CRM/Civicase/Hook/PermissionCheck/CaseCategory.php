<?php

use CRM_Civicase_Helper_CaseCategory as CaseCategoryHelper;
use CRM_Civicase_Service_CaseCategoryPermission as CaseCategoryPermission;
use CRM_Case_BAO_CaseType as CaseType;

/**
 * Class CRM_Civicase_Hook_PermissionCheck_CaseCategory.
 */
class CRM_Civicase_Hook_PermissionCheck_CaseCategory {

  /**
   * Case category permission service.
   *
   * @var CRM_Civicase_Service_CaseCategoryPermission
   */
  private $caseCategoryPermission;

  /**
   * Whether the Ajax call is for entity Case.
   *
   * @var bool
   */
  private $isCaseEntity;

  /**
   * Modify permission check based on case category.
   *
   * @param string $permission
   *   Permission name.
   * @param bool $granted
   *   Whether permission is granted or not.
   */
  public function run($permission, &$granted) {
    $this->caseCategoryPermission = new CaseCategoryPermission();

    if (!$this->shouldRun($permission, $granted)) {
      return;
    }

    $url = CRM_Utils_System::currentPath();
    $isAjaxRequest = $url == 'civicrm/ajax/rest';
    // We need to exclude this permission for this page because the permission
    // will return true as the logic for equivalent case category permission
    // will be applied.
    $isAdvancedSearchPage = $url == 'civicrm/contact/search/advanced' && $permission != 'basic case information';
    $caseCategoryName = $this->getCaseCategoryName();

    if ($caseCategoryName) {
      $this->modifyPermissionCheckForCategory($permission, $granted, $caseCategoryName);
    }
    elseif (($isAjaxRequest && !$this->isCaseEntity) || $isAdvancedSearchPage) {
      $this->checkForEquivalentCaseCategoryPermission($permission, $granted);
    }
  }

  /**
   * Checks for Equivalent Case Category Permission.
   *
   * This function checks that the user has at least any of the equivalent
   * civicase permissions.
   * Useful for pages like advanced search and the ajax request page where the
   * case category is not passed but we need to restrict or grant some access
   * based on case type categories.
   *
   * @param string $permission
   *   Permission String.
   * @param bool $granted
   *   Whether permission is granted or not.
   */
  private function checkForEquivalentCaseCategoryPermission($permission, &$granted) {
    $caseTypeCategories = CaseType::buildOptions('case_type_category', 'validate');
    foreach ($caseTypeCategories as $caseTypeCategory) {
      if ($caseTypeCategory == CaseCategoryHelper::CASE_TYPE_CATEGORY_NAME) {
        continue;
      }
      $caseCategoryPermission = $this->caseCategoryPermission->replaceWords($permission, $caseTypeCategory);
      if (!CRM_Core_Permission::check($caseCategoryPermission)) {
        $granted = FALSE;
      }
      else {
        $granted = TRUE;
        break;
      }
    }
  }

  /**
   * Modify permission check based on case category.
   *
   * @param string $permission
   *   Permission name.
   * @param bool $granted
   *   Whether permission is granted or not.
   * @param string $caseCategoryName
   *   Case category name.
   */
  private function modifyPermissionCheckForCategory($permission, &$granted, $caseCategoryName) {
    if ($caseCategoryName && strtolower($caseCategoryName) == strtolower(CaseCategoryHelper::CASE_TYPE_CATEGORY_NAME)) {
      return;
    }

    $caseCategoryPermission = $this->caseCategoryPermission->replaceWords($permission, $caseCategoryName);

    if (!CRM_Core_Permission::check($caseCategoryPermission)) {
      $granted = FALSE;
    }
    else {
      $granted = TRUE;
    }
  }

  /**
   * Determines if the hook will run.
   *
   * @param string $permission
   *   Permission name.
   * @param bool $granted
   *   Whether permission is granted or not.
   *
   * @return bool
   *   returns a boolean to determine if hook will run or not.
   */
  private function shouldRun($permission, $granted) {
    $defaultCasePermissions = array_column($this->caseCategoryPermission->get(), 'name');
    $isNotBasicCase = $permission != 'basic case information';

    return in_array($permission, $defaultCasePermissions) && !$granted && $isNotBasicCase;
  }

  /**
   * Gets the case type category name if it exists.
   *
   * @return string|null
   *   The case category name.
   */
  private function getCaseCategoryName() {
    $url = CRM_Utils_System::currentPath();
    $isViewCase = $url == 'civicrm/contact/view/case';
    $isCasePage = ($url == 'civicrm/case/add' || $url == 'civicrm/case/a');
    $isAjaxRequest = $url == 'civicrm/ajax/rest';
    $isCaseActivityPage = $url == 'civicrm/case/activity';
    $isPrintActivityReportPage = $url == 'civicrm/case/customreport/print';
    $isActivityPage = in_array($url, [
      'civicrm/activity',
      'civicrm/activity/add',
      'civicrm/activity/pdf/view',
      'civicrm/activity/email/view',
    ]);
    $isCaseContactTabPage = $url == 'civicrm/case/contact-case-tab';
    $isDownloadAllActivityFilesPage = $url == 'civicrm/case/activity/download-all-files';

    if ($isViewCase) {
      return $this->getCaseCategoryNameFromCaseIdInUrl('id');
    }

    if ($isAjaxRequest) {
      return $this->getCaseCategoryForAjaxRequest();
    }

    if ($isCasePage || $isCaseContactTabPage) {
      return $this->getCaseCategoryFromUrl();
    }

    if ($isCaseActivityPage) {
      return $this->getCaseCategoryNameFromCaseIdInUrl('caseid');
    }

    if ($isPrintActivityReportPage) {
      return $this->getCaseCategoryNameFromCaseIdInUrl('caseID');
    }

    if ($isActivityPage) {
      return $this->getCaseCategoryFromActivityIdInUrl('id');
    }

    if ($isDownloadAllActivityFilesPage) {
      return $this->getCaseCategoryFromActivityIdInUrl('activity_id');
    }
  }

  /**
   * Gets the case category type from the URL.
   *
   * @return mixed|null
   *   Category URL.
   */
  private function getCaseCategoryFromUrl() {
    $caseCategory = CRM_Utils_Request::retrieve('case_type_category', 'String');
    if ($caseCategory) {
      if (is_numeric($caseCategory)) {
        $caseTypeCategories = CaseType::buildOptions('case_type_category', 'validate');

        return isset($caseTypeCategories[$caseCategory]) ? $caseTypeCategories[$caseCategory] : NULL;
      }

      return $caseCategory;
    }

    $entryURL = CRM_Utils_Request::retrieve('entryURL', 'String');

    $urlParams = parse_url(htmlspecialchars_decode($entryURL), PHP_URL_QUERY);
    parse_str($urlParams, $urlParams);

    if (!empty($urlParams['case_type_category'])) {
      return $urlParams['case_type_category'];
    }

    return NULL;
  }

  /**
   * Returns the case category name from activity id.
   *
   * @param string $activityIdParamName
   *   Case ID Param name.
   *
   * @return string
   *   Case category name.
   */
  private function getCaseCategoryFromActivityIdInUrl($activityIdParamName) {
    $activityId = CRM_Utils_Request::retrieve($activityIdParamName, 'Integer');

    if ($activityId) {
      $result = civicrm_api3('Activity', 'get', [
        'sequential' => 1,
        'return' => ['case_id'],
        'id' => $activityId,
      ]);

      $caseId = !empty($result['values'][0]['case_id'][0]) ? $result['values'][0]['case_id'][0] : NULL;

      if ($caseId) {
        return CaseCategoryHelper::getCategoryName($caseId);
      }

      return NULL;
    }
  }

  /**
   * Returns the case category name when case Id is known.
   *
   * @param string $caseIdParamName
   *   Case ID Param name.
   *
   * @return string|null
   *   Case category name.
   */
  private function getCaseCategoryNameFromCaseIdInUrl($caseIdParamName) {
    $caseId = CRM_Utils_Request::retrieve($caseIdParamName, 'Integer');

    return CaseCategoryHelper::getCategoryName($caseId);
  }

  /**
   * Get case category name for Ajax case API requests.
   */
  private function getCaseCategoryForAjaxRequest() {
    $entity = CRM_Utils_Request::retrieve('entity', 'String');
    $json = CRM_Utils_Request::retrieve('json', 'String');
    $json = $json ? json_decode($json, TRUE) : [];

    if ($entity && strtolower($entity) == 'case') {
      $this->isCaseEntity = TRUE;
      if (isset($json['case_type_id.case_type_category'])) {
        return $this->getCaseTypeCategoryNameFromOptions($json['case_type_id.case_type_category']);
      }
    }

    if (strtolower($entity) == 'api3') {
      foreach ($json as $entity) {
        list($entityName, $action, $params) = $entity;

        if (strtolower($entityName) == 'case') {
          $this->isCaseEntity = TRUE;
          if (isset($params['case_type_id.case_type_category'])) {
            return $this->getCaseTypeCategoryNameFromOptions($params['case_type_id.case_type_category']);
          }
        }
      }
    }
  }

  /**
   * Returns the case category name from case type id or name.
   *
   * @param mixed $caseTypeCategory
   *   Case category name.
   *
   * @return string
   *   Case category name.
   */
  private function getCaseTypeCategoryNameFromOptions($caseTypeCategory) {
    if (!is_numeric($caseTypeCategory)) {
      return $caseTypeCategory;
    }

    return CaseCategoryHelper::getCaseCategoryNameFromOptionValue($caseTypeCategory);
  }

}
