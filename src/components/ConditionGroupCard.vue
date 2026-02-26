<template>
  <div class="group-card">
    <!-- Group Header -->
    <div class="group-card__header">
      <div class="group-card__header-left">
        <PolarisText variant="headingSm">Group {{ groupIndex + 1 }}</PolarisText>
        <PolarisButtonGroup segmented>
          <PolarisButton :pressed="localGroup.type === 'simple'" @click="updateType('simple')">
            Simple
          </PolarisButton>
          <PolarisButton :pressed="localGroup.type === 'aggregate'" @click="updateType('aggregate')">
            Aggregate
          </PolarisButton>
        </PolarisButtonGroup>
      </div>
      <PolarisButton variant="plain" icon="delete" iconOnly @click="$emit('remove')" />
    </div>

    <!-- Collection Select -->
    <div class="group-card__body">
      <PolarisSelect
        label="Collection"
        :modelValue="localGroup.collection || ''"
        @update:modelValue="updateCollection"
        :options="collectionOptions"
        placeholder="Select a collection..."
      />

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
                :modelValue="localGroup.value || ''"
                @update:modelValue="updateProp('value', $event)"
                type="number"
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          <div class="aggregate-row">
            <div class="condition-field condition-field--grow">
              <PolarisSelect
                label="Time range"
                :modelValue="localGroup.time_range || ''"
                @update:modelValue="updateProp('time_range', $event)"
                :options="timeRangeOptions"
                placeholder="All time"
              />
            </div>
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
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import {
  PolarisText,
  PolarisButton,
  PolarisButtonGroup,
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

const TIME_RANGES = [
  { value: '', label: 'All time' },
  { value: '7 days', label: 'Last 7 days' },
  { value: '30 days', label: 'Last 30 days' },
  { value: '60 days', label: 'Last 60 days' },
  { value: '90 days', label: 'Last 90 days' },
  { value: '180 days', label: 'Last 180 days' },
  { value: '365 days', label: 'Last 365 days' },
];

export default {
  name: 'ConditionGroupCard',
  components: {
    PolarisText,
    PolarisButton,
    PolarisButtonGroup,
    PolarisSelect,
    PolarisTextField,
  },
  props: {
    group: { type: Object, required: true },
    collections: { type: Array, default: () => [] },
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

    const selectedCollection = computed(() => {
      return safeCollections.value.find(c => c?.name === localGroup.value?.collection) || null;
    });

    const collectionOptions = computed(() => {
      return safeCollections.value.map(c => ({
        value: c?.name || '',
        label: c?.label || c?.name || 'Unknown',
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

    const aggregateFunctionOptions = computed(() => AGGREGATE_FUNCTIONS);
    const aggregateOperatorOptions = computed(() => AGGREGATE_OPERATORS);
    const timeRangeOptions = computed(() => TIME_RANGES);

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
          time_range: '',
          time_field: 'created_at',
          conditions: undefined,
        });
      }
    };

    const updateCollection = (collection) => {
      const base = { collection };
      if (localGroup.value?.type === 'simple') {
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

    return {
      localGroup,
      safeConditions,
      collectionOptions,
      fieldOptions,
      aggregateFieldOptions,
      aggregateFunctionOptions,
      aggregateOperatorOptions,
      timeRangeOptions,
      timeFieldOptions,
      getSimpleOperators,
      updateType,
      updateCollection,
      updateProp,
      updateConditionProp,
      addCondition,
      removeCondition,
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
