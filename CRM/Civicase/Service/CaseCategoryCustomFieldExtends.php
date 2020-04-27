<?php

/**
 * Class CRM_Civicase_Service_CaseCategoryCustomFieldExtends.
 */
class CRM_Civicase_Service_CaseCategoryCustomFieldExtends {

  /**
   * Entity table value.
   *
   * @var string
   */
  protected $entityTable = 'civicrm_case';

  /**
   * Creates the Custom field extend option group for case category.
   *
   * @param string $caseCategoryName
   *   Case Category Name.
   * @param string $label
   *   Label.
   * @param string $entityTypeFunction
   *   Function to fetch entity types for the entity.
   */
  public function create($caseCategoryName, $label, $entityTypeFunction = NULL) {
    $result = $this->getCgExtendOptionValue($caseCategoryName);

    if ($result['count'] > 0) {
      return;
    }

    civicrm_api3('OptionValue', 'create', [
      'option_group_id' => 'cg_extend_objects',
      'name' => $this->entityTable,
      'label' => $label,
      'value' => $this->getCustomEntityValue($caseCategoryName),
      'description' => $entityTypeFunction,
      'is_active' => TRUE,
      'is_reserved' => TRUE,
    ]);
  }

  /**
   * Deletes the Custom field extend option group for case category.
   *
   * @param string $caseCategoryName
   *   Case Category Name.
   */
  public function delete($caseCategoryName) {
    $result = $this->getCgExtendOptionValue($caseCategoryName);

    if ($result['count'] == 0) {
      return;
    }

    CRM_Core_BAO_OptionValue::del($result['values'][0]['id']);
  }

  /**
   * Return CG Extend option value.
   *
   * @param string $caseCategoryName
   *   Case category name.
   *
   * @return array
   *   Cg Extend option value.
   */
  protected function getCgExtendOptionValue($caseCategoryName) {
    $result = civicrm_api3('OptionValue', 'get', [
      'sequential' => 1,
      'value' => $this->getCustomEntityValue($caseCategoryName),
      'option_group_id' => 'cg_extend_objects',
      'name' => $this->entityTable,
    ]);

    return $result;
  }

  /**
   * Returns the custom entity value.
   *
   * @param string $caseCategoryName
   *   Case category name.
   *
   * @return string
   *   Custom entity value.
   */
  protected function getCustomEntityValue($caseCategoryName) {
    return $caseCategoryName;
  }

}
