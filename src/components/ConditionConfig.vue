<template>
  <div class="polaris-card">
    <!-- Header -->
    <div class="polaris-card__section">
      <div class="polaris-inline polaris-inline--space-between">
        <h3 class="polaris-text polaris-text--heading-sm">Condition Builder</h3>
        <div class="polaris-button-group polaris-button-group--segmented">
          <button
            class="polaris-button polaris-button--segmented"
            :class="{ 'polaris-button--segmented-selected': config?.groups_operator === 'AND' }"
            @click="emitUpdate({ ...config, groups_operator: 'AND' })"
          >All (AND)</button>
          <button
            class="polaris-button polaris-button--segmented"
            :class="{ 'polaris-button--segmented-selected': config?.groups_operator === 'OR' }"
            @click="emitUpdate({ ...config, groups_operator: 'OR' })"
          >Any (OR)</button>
        </div>
      </div>
    </div>

    <!-- Groups -->
    <div class="polaris-card__section">
      <div
        v-for="(group, gIdx) in (config?.groups || [])"
        :key="group?.id || gIdx"
        class="polaris-card polaris-card--subdued"
      >
        <div class="polaris-card__section">
          <!-- Group Header -->
          <div class="polaris-inline polaris-inline--space-between">
            <span class="polaris-text polaris-text--body-md">Group {{ gIdx + 1 }}</span>
            <div class="polaris-button-group polaris-button-group--small">
              <button
                class="polaris-button polaris-button--segmented"
                :class="{ 'polaris-button--segmented-selected': group?.operator === 'AND' }"
                @click="updateGroupOperator(group?.id, 'AND')"
              >AND</button>
              <button
                class="polaris-button polaris-button--segmented"
                :class="{ 'polaris-button--segmented-selected': group?.operator === 'OR' }"
                @click="updateGroupOperator(group?.id, 'OR')"
              >OR</button>
            </div>
            <button
              class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
              @click="removeGroup(group?.id)"
            ><span class="polaris-icon polaris-icon--small">✕</span></button>
          </div>

          <!-- Collection Selection -->
          <div class="polaris-text-field">
            <label class="polaris-text-field__label">Collection</label>
            <select
              class="polaris-select__input"
              :value="group?.collection || ''"
              @change="updateGroupCollection(group?.id, $event.target.value)"
            >
              <option value="">Select collection...</option>
              <option
                v-for="col in safeCollections"
                :key="col?.name"
                :value="col?.name"
              >{{ col?.label || col?.name }}</option>
            </select>
          </div>

          <!-- Conditions -->
          <div class="polaris-condition-list">
            <div
              v-for="(cond, cIdx) in (group?.conditions || [])"
              :key="cond?.id || cIdx"
              class="polaris-condition-item"
            >
              <div v-if="cIdx > 0" class="polaris-condition-operator">
                <span class="polaris-text polaris-text--body-md">{{ group?.operator || 'AND' }}</span>
              </div>
              <div class="polaris-condition-fields">
                <!-- Field -->
                <div class="polaris-text-field polaris-text-field--flex">
                  <label class="polaris-text-field__label">Field</label>
                  <select
                    class="polaris-select__input"
                    :value="cond?.field || ''"
                    @change="updateConditionField(group?.id, cond?.id, $event.target.value)"
                  >
                    <option value="">Select field...</option>
                    <option
                      v-for="f in getFieldsForCollection(group?.collection)"
                      :key="f?.name"
                      :value="f?.name"
                    >{{ f?.label || f?.name }}</option>
                  </select>
                </div>
                <!-- Operator -->
                <div class="polaris-text-field polaris-text-field--operator">
                  <label class="polaris-text-field__label">Operator</label>
                  <select
                    class="polaris-select__input"
                    :value="cond?.operator || 'equals'"
                    @change="updateConditionOperator(group?.id, cond?.id, $event.target.value)"
                  >
                    <option
                      v-for="op in getOperatorsForField(group?.collection, cond?.field)"
                      :key="op?.value"
                      :value="op?.value"
                    >{{ op?.label }}</option>
                  </select>
                </div>
                <!-- Value -->
                <div v-if="isValueRequired(cond?.operator)" class="polaris-text-field polaris-text-field--flex">
                  <label class="polaris-text-field__label">Value</label>
                  <input
                    class="polaris-text-field__input"
                    type="text"
                    :value="cond?.value || ''"
                    placeholder="Enter value..."
                    @input="updateConditionValue(group?.id, cond?.id, $event.target.value)"
                  />
                </div>
                <!-- Remove -->
                <button
                  class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
                  style="align-self: flex-end;"
                  @click="removeCondition(group?.id, cond?.id)"
                ><span class="polaris-icon polaris-icon--small">✕</span></button>
              </div>
            </div>
          </div>

          <!-- Add Condition -->
          <div class="polaris-inline polaris-inline--gap-tight" style="margin-top: var(--p-space-300);">
            <button
              class="polaris-button polaris-button--outline polaris-button--slim"
              @click="addCondition(group?.id)"
            >+ Add Condition</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!config?.groups?.length"
        class="polaris-empty-state"
      >
        <p class="polaris-text polaris-text--body-md" style="color: var(--p-color-text-secondary);">No condition groups yet</p>
      </div>

      <!-- Add Group -->
      <div style="margin-top: var(--p-space-400);">
        <button
          class="polaris-button polaris-button--full-width"
          @click="addGroup"
        >+ Add Group</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

const OPERATORS_BY_TYPE = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'not contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'greater_than_or_equals', label: '≥' },
    { value: 'less_than', label: '<' },
    { value: 'less_than_or_equals', label: '≤' },
    { value: 'between', label: 'between' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  date: [
    { value: 'equals', label: 'equals' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'between', label: 'between' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  array: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
};

export default {
  name: 'ConditionConfig',
  props: {
    config: { type: Object, required: true },
    collections: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    // Safe collections - ensure it's always an array
    const safeCollections = computed(() => {
      return Array.isArray(props.collections) ? props.collections : [];
    });

    const emitUpdate = (newConfig) => {
      emit('update', newConfig);
    };

    const getFieldsForCollection = (collectionName) => {
      // Ensure collections is an array before calling .find()
      const collectionsArray = Array.isArray(props.collections) ? props.collections : [];
      const collection = collectionsArray.find(c => c?.name === collectionName);
      return collection?.fields || [];
    };

    const getFieldType = (collectionName, fieldName) => {
      const fields = getFieldsForCollection(collectionName);
      const field = fields.find(f => f?.name === fieldName);
      return field?.type || 'string';
    };

    const getOperatorsForField = (collectionName, fieldName) => {
      const fieldType = getFieldType(collectionName, fieldName);
      return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;
    };

    const isValueRequired = (operator) => {
      return !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(operator);
    };

    const addGroup = () => {
      const groups = [...(props.config?.groups || [])];
      groups.push({
        id: `group-${Date.now()}`,
        collection: '',
        operator: 'AND',
        conditions: [{
          id: `cond-${Date.now()}`,
          field: '',
          operator: 'equals',
          value: '',
        }],
      });
      emitUpdate({ ...props.config, groups });
    };

    const removeGroup = (groupId) => {
      const groups = (props.config?.groups || []).filter(g => g?.id !== groupId);
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupCollection = (groupId, collection) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            collection,
            conditions: [{
              id: `cond-${Date.now()}`,
              field: '',
              operator: 'equals',
              value: '',
            }],
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateGroupOperator = (groupId, operator) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return { ...g, operator };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const addCondition = (groupId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: [
              ...(g?.conditions || []),
              {
                id: `cond-${Date.now()}`,
                field: '',
                operator: 'equals',
                value: '',
              },
            ],
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const removeCondition = (groupId, conditionId) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).filter(c => c?.id !== conditionId),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionField = (groupId, conditionId, field) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) {
                return { ...c, field, operator: 'equals', value: '' };
              }
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionOperator = (groupId, conditionId, operator) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) {
                return { ...c, operator };
              }
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    const updateConditionValue = (groupId, conditionId, value) => {
      const groups = (props.config?.groups || []).map(g => {
        if (g?.id === groupId) {
          return {
            ...g,
            conditions: (g?.conditions || []).map(c => {
              if (c?.id === conditionId) {
                return { ...c, value };
              }
              return c;
            }),
          };
        }
        return g;
      });
      emitUpdate({ ...props.config, groups });
    };

    return {
      safeCollections,
      getFieldsForCollection,
      getOperatorsForField,
      isValueRequired,
      addGroup,
      removeGroup,
      updateGroupCollection,
      updateGroupOperator,
      addCondition,
      removeCondition,
      updateConditionField,
      updateConditionOperator,
      updateConditionValue,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.polaris-card {
  @include polaris-tokens;
  @include polaris-card;
  &--subdued {
    background: var(--p-color-bg-surface-secondary);
    box-shadow: none;
    border: 1px solid var(--p-color-border);
  }
  &__section { @include polaris-card-section; }
}

.polaris-inline {
  @include polaris-inline;
  &--space-between { justify-content: space-between; }
  &--gap-tight { gap: var(--p-space-200); }
}

.polaris-text {
  &--body-md { @include polaris-text-body; }
  &--heading-sm { @include polaris-text-heading-sm; }
}

.polaris-button {
  @include polaris-button-base;
  &--plain { @include polaris-button-plain; }
  &--critical { color: var(--p-color-text-critical); }
  &--outline { @include polaris-button-outline; }
  &--icon-only { @include polaris-button-icon-only; }
  &--full-width { @include polaris-button-full-width; }
  &--slim { @include polaris-button-slim; }
  
  &--segmented {
    border-radius: 0;
    background: var(--p-color-bg-surface);
    color: var(--p-color-text);
    box-shadow: inset 0 0 0 1px var(--p-color-border);
    &:first-child { border-radius: var(--p-border-radius-200) 0 0 var(--p-border-radius-200); }
    &:last-child { border-radius: 0 var(--p-border-radius-200) var(--p-border-radius-200) 0; }
  }
  &--segmented-selected {
    background: var(--p-color-bg-surface-selected);
    color: var(--p-color-text-brand);
    box-shadow: inset 0 0 0 2px var(--p-color-border-brand);
  }
}

.polaris-button-group {
  @include polaris-button-group;
  &--segmented { @include polaris-button-group-segmented; }
  &--small .polaris-button { @include polaris-button-slim; }
}

.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
  &--flex { flex: 1; }
  &--operator { width: 120px; flex-shrink: 0; }
}

.polaris-text-field__label { @include polaris-label; }
.polaris-text-field__input { @include polaris-input; }
.polaris-select__input { @include polaris-select; }

.polaris-icon {
  @include polaris-icon;
  &--small { @include polaris-icon-small; }
}

.polaris-condition-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
  margin-top: var(--p-space-300);
}

.polaris-condition-item {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
}

.polaris-condition-operator {
  display: flex;
  justify-content: center;
  padding: var(--p-space-100) 0;
}

.polaris-condition-fields {
  display: flex;
  gap: var(--p-space-200);
  align-items: flex-end;
}

// Consistent spacing
.polaris-card + .polaris-card { margin-top: var(--p-space-300); }
.polaris-card--subdued + .polaris-card--subdued { margin-top: var(--p-space-300); }
.polaris-text-field + .polaris-text-field { margin-top: var(--p-space-300); }
</style>
