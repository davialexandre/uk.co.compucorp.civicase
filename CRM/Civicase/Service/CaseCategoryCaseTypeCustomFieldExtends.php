<?php

/**
 * Class CRM_Civicase_Service_CaseCategoryCaseTypeCustomFieldExtends.
 */
class CRM_Civicase_Service_CaseCategoryCaseTypeCustomFieldExtends extends CRM_Civicase_Service_CaseCategoryCustomFieldExtends {

  /**
   * {@inheritdoc}
   */
  protected $entityTable = 'civicrm_case_type';

  /**
   * {@inheritdoc}
   */
  protected function getCustomEntityValue($caseCategoryName) {
    return "{$caseCategoryName}Type";
  }

}
