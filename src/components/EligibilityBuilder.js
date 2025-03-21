import React, { useState } from "react";
import { Select, Input, Button, Space, Card, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const EligibilityBuilder = ({ onSave }) => {
  const [rules, setRules] = useState([]);

  // Define fields with priority order
  const fieldOptions = [
    {
      label: "Specific Collections",
      value: "collections",
      priority: 1,
      operators: [
        { label: "Contains Any", value: "contains_any", type: "inclusion" },
        { label: "Is Not", value: "is_not", type: "exclusion" },
      ],
      mutuallyExclusiveWith: "products",
    },
    {
      label: "Product Tags",
      value: "product_tags",
      priority: 2,
      operators: [
        { label: "Contains Any", value: "contains_any", type: "inclusion" },
        { label: "Is Not", value: "is_not", type: "exclusion" },
      ],
    },
    {
      label: "Specific Products",
      value: "products",
      priority: 3,
      operators: [
        { label: "Equals Anything", value: "equals_anything", type: "neutral" },
        { label: "Contains Any", value: "contains_any", type: "inclusion" },
        { label: "Is Not", value: "is_not", type: "exclusion" },
      ],
      mutuallyExclusiveWith: "collections",
    },
    {
      label: "Product Subscribed",
      value: "subscribed",
      priority: 4,
      operators: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      label: "Specific Discount Codes",
      value: "discount_codes",
      priority: 5,
      operators: [{ label: "Equals", value: "equals" }],
    },
    {
      label: "Cart Value Range",
      value: "cart_value",
      priority: 6,
      operators: [
        { label: "Is Equal or Greater Than", value: "gte" },
        { label: "Is Between", value: "between" },
        { label: "Is Less Than", value: "lt" },
      ],
    },
  ];

  const addRule = () => {
    const newRule = {
      id: Date.now().toString(),
      field: "",
      operator: "",
      value: "",
      secondValue: "",
      priority: 0,
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const updateRule = (id, field, value) => {
    setRules(
      rules
        .map((rule) => {
          if (rule.id === id) {
            const updatedRule = { ...rule, [field]: value };

            // Update priority when field changes
            if (field === "field") {
              const fieldOption = fieldOptions.find((f) => f.value === value);
              updatedRule.priority = fieldOption ? fieldOption.priority : 0;
              updatedRule.operator = "";
              updatedRule.value = "";
              updatedRule.secondValue = "";
            }

            // Reset value when operator changes
            if (field === "operator") {
              updatedRule.value = "";
              updatedRule.secondValue = "";
            }

            return updatedRule;
          }
          return rule;
        })
        .sort((a, b) => a.priority - b.priority) // Sort by priority
    );
  };

  const handleSave = () => {
    onSave(rules);
  };

  const getOperatorOptions = (fieldValue) => {
    const field = fieldOptions.find((f) => f.value === fieldValue);
    if (!field) return [];

    return field.operators.map((operator) => ({
      ...operator,
      disabled: isOperatorDisabled(fieldValue, operator),
    }));
  };

  // Check if operator should be disabled based on mutual exclusivity
  const isOperatorDisabled = (fieldValue, operator) => {
    const field = fieldOptions.find((f) => f.value === fieldValue);
    if (!field || !field.mutuallyExclusiveWith) return false;

    const relatedRule = rules.find(
      (rule) => rule.field === field.mutuallyExclusiveWith && rule.operator
    );

    if (!relatedRule) return false;

    const relatedField = fieldOptions.find(
      (f) => f.value === relatedRule.field
    );
    const relatedOperator = relatedField.operators.find(
      (op) => op.value === relatedRule.operator
    );

    // If related rule uses inclusion, disable inclusion operators
    // If related rule uses exclusion, disable exclusion operators
    return (
      relatedOperator.type === operator.type && operator.type !== "neutral"
    );
  };

  const renderValueInput = (rule) => {
    if (!rule.field || !rule.operator) return null;

    if (rule.field === "subscribed") {
      return null;
    }

    if (rule.field === "cart_value") {
      return (
        <Space>
          <InputNumber
            style={{ width: 120 }}
            placeholder="Enter amount"
            value={rule.value}
            onChange={(value) => updateRule(rule.id, "value", value)}
            prefix="$"
            min={0}
          />
          {rule.operator === "between" && (
            <>
              <span>and</span>
              <InputNumber
                style={{ width: 120 }}
                placeholder="Enter amount"
                value={rule.secondValue}
                onChange={(value) => updateRule(rule.id, "secondValue", value)}
                prefix="$"
                min={0}
              />
            </>
          )}
        </Space>
      );
    }

    return (
      <Input
        style={{ width: 200 }}
        placeholder={`Enter ${rule.field.replace(/_/g, " ")}`}
        value={rule.value}
        onChange={(e) => updateRule(rule.id, "value", e.target.value)}
      />
    );
  };

  // Check if field should be disabled based on mutual exclusivity
  const isFieldDisabled = (fieldValue) => {
    const field = fieldOptions.find((f) => f.value === fieldValue);
    if (!field || !field.mutuallyExclusiveWith) return false;

    return rules.some((rule) => rule.field === field.mutuallyExclusiveWith);
  };

  return (
    <Card title="Eligibility Rules" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {rules.map((rule) => (
          <Card key={rule.id} size="small">
            <Space>
              <Select
                style={{ width: 200 }}
                placeholder="Select field"
                options={fieldOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                  disabled: isFieldDisabled(option.value),
                }))}
                value={rule.field || undefined}
                onChange={(value) => updateRule(rule.id, "field", value)}
              />
              <Select
                style={{ width: 200 }}
                placeholder="Select operator"
                options={getOperatorOptions(rule.field)}
                value={rule.operator || undefined}
                onChange={(value) => updateRule(rule.id, "operator", value)}
                disabled={!rule.field}
              />
              {renderValueInput(rule)}
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeRule(rule.id)}
              />
            </Space>
          </Card>
        ))}
        <Button
          type="dashed"
          onClick={addRule}
          icon={<PlusOutlined />}
          style={{ width: "100%" }}
        >
          Add Rule
        </Button>
      </Space>
    </Card>
  );
};

export default EligibilityBuilder;
