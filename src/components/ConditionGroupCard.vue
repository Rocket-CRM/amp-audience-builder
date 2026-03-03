<template>
  <div class="group-card">
    <!-- Group Header -->
    <div class="group-card__header">
      <div class="group-card__header-left">
        <PolarisText variant="headingSm">Group {{ groupIndex + 1 }}</PolarisText>
      </div>
      <PolarisButton variant="plain" icon="delete" iconOnly @click="$emit('remove')" />
    </div>

    <div class="group-card__body">
      <!-- Collection Select -->
      <PolarisSelect
        label="Collection"
        :modelValue="localGroup.collection || ''"
        @update:modelValue="updateCollection"
        :options="collectionOptions"
        placeholder="Select a collection..."
      />

      <!-- ========== AUDIENCE MEMBERSHIP MODE ========== -->
      <template v-if="isAudienceMembership">
        <div class="conditions-list">
          <div class="condition-fields">
            <div class="condition-field condition-field--operator">
              <PolarisSelect
                label="Operator"
                :modelValue="safeConditions[0]?.operator || 'is_member_of'"
                @update:modelValue="updateAudienceOperator($event)"
                :options="audienceOperatorOptions"
              />
            </div>
            <div class="condition-field condition-field--grow">
              <PolarisSelect
                label="Audience"
                :modelValue="safeConditions[0]?.value || ''"
                @update:modelValue="updateAudienceValue($event)"
                :options="audienceSelectOptions"
                placeholder="Select an audience..."
              />
            </div>
          </div>
        </div>
      </template>

      <!-- ========== STANDARD MODES ========== -->
      <template v-else>
        <!-- Simple / Aggregate Mode Selector (Pattern 12 radio cards) -->
        <div v-if="collectionHasAggregate" class="entry-type-selector">
          <span class="entry-type-selector__label">Condition type</span>
          <div class="entry-type-options">
            <label
              class="entry-type-option"
              :class="{ 'entry-type-option--active': localGroup.type === 'simple' }"
            >
              <input
                type="radio"
                value="simple"
                :checked="localGroup.type === 'simple'"
                @change="updateType('simple')"
              />
              <div class="entry-type-option__content">
                <span class="entry-type-option__icon">📋</span>
                <div>
                  <span class="entry-type-option__title">Simple</span>
                  <span class="entry-type-option__desc">Match individual field values</span>
                </div>
              </div>
            </label>
            <label
              class="entry-type-option"
              :class="{ 'entry-type-option--active': localGroup.type === 'aggregate' }"
            >
              <input
                type="radio"
                value="aggregate"
                :checked="localGroup.type === 'aggregate'"
                @change="updateType('aggregate')"
              />
              <div class="entry-type-option__content">
                <span class="entry-type-option__icon">📊</span>
                <div>
                  <span class="entry-type-option__title">Aggregate</span>
                  <span class="entry-type-option__desc">Calculate totals, counts, or averages</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- ========== SIMPLE MODE ========== -->
        <template v-if="localGroup.type === 'simple'">
          <div class="conditions-list">
            <div
              v-for="(cond, idx) in safeConditions"
              :key="cond.id || idx"
              class="condition-row"
            >
              <div v-if="idx > 0" class="condition-connector">
                <span class="connector-label">AND</span>
              </div>
              <div class="condition-fields">
                <div class="condition-field condition-field--grow">
                  <PolarisSelect
                    label="Field"
                    labelHidden
                    :modelValue="cond.field || ''"
                    @update:modelValue="updateConditionProp(idx, 'field', $event)"
                    :options="fieldOptions"
                    placeholder="Select field..."
                    size="small"
                  />
                </div>
                <div class="condition-field condition-field--operator">
                  <PolarisSelect
                    label="Operator"
                    labelHidden
                    :modelValue="cond.operator || 'equals'"
                    @update:modelValue="updateConditionProp(idx, 'operator', $event)"
                    :options="getSimpleOperators(cond.field)"
                    size="small"
                  />
                </div>
                <div class="condition-field condition-field--grow">
                  <PolarisTextField
                    label="Value"
                    labelHidden
                    :modelValue="cond.value || ''"
                    @update:modelValue="updateConditionProp(idx, 'value', $event)"
                    placeholder="Value..."
                  />
                </div>
                <PolarisButton
                  variant="plain"
                  icon="close"
                  iconOnly
                  @click="removeCondition(idx)"
                />
              </div>
            </div>
          </div>

          <PolarisButton variant="plain" icon="plus" @click="addCondition">
            Add condition
          </PolarisButton>
        </template>

        <!-- ========== AGGREGATE MODE ========== -->
        <template v-else-if="localGroup.type === 'aggregate'">
          <div class="aggregate-fields">
            <div class="aggregate-row">
              <div class="condition-field condition-field--grow">
                <PolarisSelect
                  label="Function"
                  :modelValue="localGroup.aggregate || ''"
                  @update:modelValue="updateProp('aggregate', $event)"
                  :options="aggregateFunctionOptions"
                  placeholder="Select function..."
                />
              </div>
              <div class="condition-field condition-field--grow">
                <PolarisSelect
                  label="Field"
                  :modelValue="localGroup.field || ''"
                  @update:modelValue="updateProp('field', $event)"
                  :options="aggregateFieldOptions"
                  placeholder="Select field..."
                />
              </div>
            </div>

            <div class="aggregate-row">
              <div class="condition-field condition-field--operator">
                <PolarisSelect
                  label="Operator"
                  :modelValue="localGroup.operator || 'gte'"
                  @update:modelValue="updateProp('operator', $event)"
                  :options="aggregateOperatorOptions"
                />
              </div>
              <div class="condition-field condition-field--grow">
                <PolarisTextField
                  label="Threshold"
                  :modelValue="localGroup.value != null ? String(localGroup.value) : ''"
                  @update:modelValue="updateProp('value', $event)"
                  type="number"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div class="aggregate-row">
              <div class="condition-field condition-field--grow">
                <PolarisTextField
                  label="Time range"
                  :modelValue="localGroup.time_range?.value != null ? String(localGroup.time_range.value) : ''"
                  @update:modelValue="updateTimeRangeValue($event)"
                  type="number"
                  placeholder="e.g. 30 (leave empty for all time)"
                />
              </div>
              <div class="condition-field condition-field--grow">
                <PolarisSelect
                  label="Unit"
                  :modelValue="localGroup.time_range?.unit || 'days'"
                  @update:modelValue="updateTimeRangeUnit($event)"
                  :options="timeRangeUnitOptions"
                  :disabled="!localGroup.time_range?.value"
                />
              </div>
            </div>

            <div class="aggregate-row">
              <div class="condition-field condition-field--grow">
                <PolarisSelect
                  label="Time field"
                  :modelValue="localGroup.time_field || 'created_at'"
                  @update:modelValue="updateProp('time_field', $event)"
                  :options="timeFieldOptions"
                />
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import {
  PolarisText,
  PolarisButton,
  PolarisSelect,
  PolarisTextField,
} from 'polaris-weweb-styles/components';

const SIMPLE_OPERATORS = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'greater_or_equal', label: 'is greater than or equal to' },
    { value: 'less_than', label: 'is less than' },
    { value: 'less_or_equal', label: 'is less than or equal to' },
  ],
  boolean: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
  ],
  date: [
    { value: 'equals', label: 'equals' },
    { value: 'greater_than', label: 'is after' },
    { value: 'less_than', label: 'is before' },
  ],
  uuid: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
  ],
};

const AGGREGATE_FUNCTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

const AGGREGATE_OPERATORS = [
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal to' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal to' },
  { value: 'eq', label: 'equals' },
];

const TIME_RANGE_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

const AUDIENCE_OPERATORS = [
  { value: 'is_member_of', label: 'Is member of' },
  { value: 'is_not_member_of', label: 'Is not member of' },
];

export default {
  name: 'ConditionGroupCard',
  components: {
    PolarisText,
    PolarisButton,
    PolarisSelect,
    PolarisTextField,
  },
  props: {
    group: { type: Object, required: true },
    collections: { type: Array, default: () => [] },
    audiences: { type: Array, default: () => [] },
    groupIndex: { type: Number, default: 0 },
  },
  emits: ['update', 'remove'],
  setup(props, { emit }) {
    const localGroup = computed(() => props.group || {});
    const safeCollections = computed(() => Array.isArray(props.collections) ? props.collections : []);

    const safeConditions = computed(() => {
      const conds = localGroup.value?.conditions;
      return Array.isArray(conds) ? conds : [];
    });

    const isAudienceMembership = computed(() => {
      return localGroup.value?.collection === 'amp_audience_member';
    });

    const selectedCollection = computed(() => {
      return safeCollections.value.find(c => c?.name === localGroup.value?.collection) || null;
    });

    const collectionHasAggregate = computed(() => {
      return !!selectedCollection.value?.has_aggregate;
    });

    const collectionOptions = computed(() => {
      return safeCollections.value.map(c => ({
        value: c?.name || '',
        label: c?.name === 'amp_audience_member'
          ? 'Audience Membership'
          : (c?.label || c?.name || 'Unknown'),
      }));
    });

    const fieldOptions = computed(() => {
      const fields = selectedCollection.value?.fields || [];
      return fields.map(f => ({
        value: f?.name || '',
        label: f?.label || f?.name || 'Unknown',
      }));
    });

    const aggregateFieldOptions = computed(() => {
      const fields = selectedCollection.value?.aggregate_fields || selectedCollection.value?.fields || [];
      return fields
        .filter(f => f?.type === 'number' || f?.type === 'integer')
        .map(f => ({
          value: f?.name || '',
          label: f?.label || f?.name || 'Unknown',
        }));
    });

    const timeFieldOptions = computed(() => {
      const fields = selectedCollection.value?.fields || [];
      return fields
        .filter(f => f?.type === 'date' || f?.type === 'timestamp' || f?.name?.includes('_at') || f?.name?.includes('date'))
        .map(f => ({
          value: f?.name || '',
          label: f?.label || f?.name || 'Unknown',
        }));
    });

    const audienceSelectOptions = computed(() => {
      const auds = Array.isArray(props.audiences) ? props.audiences : [];
      return auds.map(a => ({
        value: a?.id || '',
        label: a?.name || a?.id || 'Unknown',
      }));
    });

    const aggregateFunctionOptions = computed(() => AGGREGATE_FUNCTIONS);
    const aggregateOperatorOptions = computed(() => AGGREGATE_OPERATORS);
    const timeRangeUnitOptions = computed(() => TIME_RANGE_UNITS);
    const audienceOperatorOptions = computed(() => AUDIENCE_OPERATORS);

    const getFieldType = (fieldName) => {
      const fields = selectedCollection.value?.fields || [];
      const field = fields.find(f => f?.name === fieldName);
      return field?.type || 'string';
    };

    const getSimpleOperators = (fieldName) => {
      const type = getFieldType(fieldName);
      return SIMPLE_OPERATORS[type] || SIMPLE_OPERATORS.string;
    };

    const emitGroup = (updated) => {
      emit('update', { ...localGroup.value, ...updated });
    };

    const updateType = (type) => {
      if (type === 'simple') {
        emitGroup({
          type: 'simple',
          conditions: safeConditions.value.length
            ? safeConditions.value
            : [{ id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' }],
          aggregate: undefined,
          field: undefined,
          operator: undefined,
          value: undefined,
          time_range: undefined,
          time_field: undefined,
        });
      } else {
        emitGroup({
          type: 'aggregate',
          aggregate: 'sum',
          field: '',
          operator: 'gte',
          value: '',
          time_range: null,
          time_field: 'created_at',
          conditions: undefined,
        });
      }
    };

    const updateCollection = (collection) => {
      const base = { collection };
      if (collection === 'amp_audience_member') {
        base.type = 'simple';
        base.conditions = [{ id: `cond-${Date.now()}`, field: 'audience_id', operator: 'is_member_of', value: '' }];
        base.aggregate = undefined;
        base.field = undefined;
        base.operator = undefined;
        base.value = undefined;
        base.time_range = undefined;
        base.time_field = undefined;
      } else if (localGroup.value?.type === 'simple') {
        base.conditions = [{ id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' }];
      } else {
        base.field = '';
      }
      emitGroup(base);
    };

    const updateProp = (key, value) => {
      emitGroup({ [key]: value });
    };

    const updateConditionProp = (idx, key, value) => {
      const conditions = [...safeConditions.value];
      const updated = { ...conditions[idx], [key]: value };
      if (key === 'field') {
        updated.operator = 'equals';
        updated.value = '';
      }
      conditions[idx] = updated;
      emitGroup({ conditions });
    };

    const addCondition = () => {
      const conditions = [
        ...safeConditions.value,
        { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, field: '', operator: 'equals', value: '' },
      ];
      emitGroup({ conditions });
    };

    const removeCondition = (idx) => {
      const conditions = safeConditions.value.filter((_, i) => i !== idx);
      emitGroup({ conditions });
    };

    const updateAudienceOperator = (operator) => {
      const base = safeConditions.value[0] || { id: `cond-${Date.now()}`, field: 'audience_id' };
      emitGroup({ conditions: [{ ...base, field: 'audience_id', operator }] });
    };

    const updateAudienceValue = (value) => {
      const base = safeConditions.value[0] || { id: `cond-${Date.now()}`, field: 'audience_id', operator: 'is_member_of' };
      emitGroup({ conditions: [{ ...base, field: 'audience_id', value }] });
    };

    const updateTimeRangeValue = (val) => {
      const numVal = val ? Number(val) : null;
      if (numVal && numVal > 0) {
        emitGroup({ time_range: { value: numVal, unit: localGroup.value?.time_range?.unit || 'days' } });
      } else {
        emitGroup({ time_range: null });
      }
    };

    const updateTimeRangeUnit = (unit) => {
      const currentVal = localGroup.value?.time_range?.value;
      if (currentVal) {
        emitGroup({ time_range: { value: currentVal, unit } });
      }
    };

    return {
      localGroup,
      safeConditions,
      isAudienceMembership,
      collectionHasAggregate,
      collectionOptions,
      fieldOptions,
      aggregateFieldOptions,
      aggregateFunctionOptions,
      aggregateOperatorOptions,
      timeRangeUnitOptions,
      timeFieldOptions,
      audienceOperatorOptions,
      audienceSelectOptions,
      getSimpleOperators,
      updateType,
      updateCollection,
      updateProp,
      updateConditionProp,
      addCondition,
      removeCondition,
      updateAudienceOperator,
      updateAudienceValue,
      updateTimeRangeValue,
      updateTimeRangeUnit,
    };
  },
};
</script>

<style lang="scss" scoped>
.group-card {
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
}

.group-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-300) var(--p-space-400);
  border-bottom: 1px solid var(--p-color-border);
  background: var(--p-color-bg-surface-secondary);
  border-radius: var(--p-border-radius-300) var(--p-border-radius-300) 0 0;
}

.group-card__header-left {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
}

.group-card__body {
  padding: var(--p-space-400);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.entry-type-selector {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);

  &__label {
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text);
  }
}

.entry-type-options {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-150);
}

.entry-type-option {
  display: flex;
  align-items: flex-start;
  gap: var(--p-space-200);
  padding: var(--p-space-300);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  cursor: pointer;
  transition: all var(--p-motion-duration-150) var(--p-motion-ease);
  background: var(--p-color-bg-surface);

  input[type="radio"] {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    cursor: pointer;
    flex-shrink: 0;
    accent-color: var(--p-color-bg-fill-brand);
  }

  &:hover {
    background: var(--p-color-bg-surface-hover);
  }

  &--active {
    border-color: var(--p-color-border-brand);
    background: var(--p-color-bg-surface-selected);
  }

  &__content {
    display: flex;
    align-items: flex-start;
    gap: var(--p-space-200);
    flex: 1;
  }

  &__icon {
    font-size: 18px;
    flex-shrink: 0;
    line-height: 1.2;
  }

  &__title {
    display: block;
    font-size: var(--p-font-size-300);
    font-weight: var(--p-font-weight-medium);
    color: var(--p-color-text);
  }

  &__desc {
    display: block;
    font-size: var(--p-font-size-275);
    color: var(--p-color-text-secondary);
    margin-top: 1px;
  }
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.condition-row {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.condition-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--p-space-100) 0;
}

.connector-label {
  font-size: var(--p-font-size-300);
  font-weight: var(--p-font-weight-semibold);
  color: var(--p-color-text-secondary);
  background: var(--p-color-bg-surface-secondary);
  padding: 2px var(--p-space-200);
  border-radius: var(--p-border-radius-100);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.condition-fields {
  display: flex;
  gap: var(--p-space-200);
  align-items: flex-end;

  :deep(select),
  :deep(input:not([type="checkbox"]):not([type="radio"])) {
    height: 36px;
    box-sizing: border-box;
  }
}

.condition-field {
  min-width: 0;

  &--grow {
    flex: 1;
  }

  &--operator {
    width: 180px;
    flex-shrink: 0;
  }
}

.aggregate-fields {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);
}

.aggregate-row {
  display: flex;
  gap: var(--p-space-300);
  align-items: flex-end;

  :deep(select),
  :deep(input:not([type="checkbox"]):not([type="radio"])) {
    height: 36px;
    box-sizing: border-box;
  }
}

@media (max-width: 640px) {
  .condition-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .condition-field--operator {
    width: 100%;
  }

  .aggregate-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
