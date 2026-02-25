<template>
  <div class="audience-builder-form">
    <!-- Header -->
    <div class="builder-header">
      <PolarisButton variant="plain" icon="arrowLeft" @click="handleCancel">
        Back
      </PolarisButton>
      <PolarisText variant="headingLg">
        {{ isEditing ? 'Edit Audience' : 'Create Audience' }}
      </PolarisText>
    </div>

    <!-- Validation Errors -->
    <PolarisBanner
      v-if="validationErrors.length"
      variant="critical"
      title="Please fix the following errors"
      dismissible
      @dismiss="validationErrors = []"
    >
      <ul class="error-list">
        <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
      </ul>
    </PolarisBanner>

    <div class="builder-content">
      <!-- Name & Description Card -->
      <PolarisCard sectioned>
        <PolarisBlockStack gap="400">
          <PolarisTextField
            label="Audience name"
            :modelValue="name"
            @update:modelValue="name = $event"
            required
            placeholder="e.g. High-Value Customers"
            :error="nameError"
          />
          <PolarisTextField
            label="Description"
            :modelValue="description"
            @update:modelValue="description = $event"
            multiline
            :rows="2"
            placeholder="Describe who belongs in this audience..."
          />
        </PolarisBlockStack>
      </PolarisCard>

      <!-- Conditions Card -->
      <PolarisCard>
        <PolarisCardSection>
          <PolarisBlockStack gap="100">
            <PolarisText variant="headingMd">Conditions</PolarisText>
            <PolarisText variant="bodySm" color="subdued">
              Users must satisfy ALL groups below to qualify for this audience.
            </PolarisText>
          </PolarisBlockStack>
        </PolarisCardSection>

        <PolarisCardSection>
          <div class="condition-builder-area">
            <!-- Condition Groups -->
            <div v-if="conditionGroups.length" class="condition-groups">
              <template v-for="(group, idx) in conditionGroups" :key="group.id">
                <div v-if="idx > 0" class="and-connector">
                  <div class="and-connector__line"></div>
                  <span class="and-connector__badge">AND</span>
                  <div class="and-connector__line"></div>
                </div>
                <ConditionGroupCard
                  :group="group"
                  :collections="safeCollections"
                  :groupIndex="idx"
                  @update="updateGroup(idx, $event)"
                  @remove="removeGroup(idx)"
                />
              </template>
            </div>

            <!-- Empty state for no groups -->
            <PolarisEmptyState
              v-if="!conditionGroups.length"
              heading="No conditions defined"
              icon="🎯"
              compact
            >
              Add at least one condition group to define who belongs in this audience.
            </PolarisEmptyState>

            <!-- Add Group Button -->
            <PolarisButton variant="outline" icon="plus" fullWidth @click="addGroup">
              Add condition group
            </PolarisButton>
          </div>
        </PolarisCardSection>
      </PolarisCard>
    </div>

    <!-- Footer -->
    <div class="builder-footer">
      <PolarisButton @click="handleCancel">Cancel</PolarisButton>
      <PolarisButton variant="primary" @click="handleSave" :loading="isSaving">
        {{ isEditing ? 'Update Audience' : 'Create Audience' }}
      </PolarisButton>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import {
  PolarisText,
  PolarisButton,
  PolarisCard,
  PolarisCardSection,
  PolarisBlockStack,
  PolarisTextField,
  PolarisBanner,
  PolarisEmptyState,
} from 'polaris-weweb-styles/components';
import ConditionGroupCard from './ConditionGroupCard.vue';

export default {
  name: 'AudienceBuilder',
  components: {
    PolarisText,
    PolarisButton,
    PolarisCard,
    PolarisCardSection,
    PolarisBlockStack,
    PolarisTextField,
    PolarisBanner,
    PolarisEmptyState,
    ConditionGroupCard,
  },
  props: {
    audience: { type: Object, default: null },
    collections: { type: Array, default: () => [] },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const name = ref('');
    const description = ref('');
    const conditionGroups = ref([]);
    const validationErrors = ref([]);
    const isSaving = ref(false);

    const isEditing = computed(() => !!props.audience?.id);
    const safeCollections = computed(() => Array.isArray(props.collections) ? props.collections : []);

    const nameError = computed(() => {
      if (validationErrors.value.length && !name.value?.trim()) {
        return 'Name is required';
      }
      return '';
    });

    const makeGroupId = () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const initFromAudience = () => {
      const aud = props.audience;
      if (aud) {
        name.value = aud.name || '';
        description.value = aud.description || '';
        const groups = aud.conditions?.groups;
        if (Array.isArray(groups) && groups.length) {
          conditionGroups.value = groups.map(g => ({
            ...g,
            id: g.id || makeGroupId(),
            conditions: g.type === 'simple'
              ? (g.conditions || []).map(c => ({ ...c, id: c.id || `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))
              : g.conditions,
          }));
        } else {
          conditionGroups.value = [];
        }
      } else {
        name.value = '';
        description.value = '';
        conditionGroups.value = [];
      }
      validationErrors.value = [];
    };

    watch(() => props.audience, initFromAudience, { immediate: true, deep: true });

    const addGroup = () => {
      conditionGroups.value.push({
        id: makeGroupId(),
        type: 'simple',
        collection: '',
        conditions: [
          { id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' },
        ],
      });
    };

    const removeGroup = (idx) => {
      conditionGroups.value.splice(idx, 1);
    };

    const updateGroup = (idx, updated) => {
      conditionGroups.value[idx] = { ...conditionGroups.value[idx], ...updated };
      conditionGroups.value = [...conditionGroups.value];
    };

    const validate = () => {
      const errors = [];
      if (!name.value?.trim()) {
        errors.push('Audience name is required');
      }
      if (!conditionGroups.value.length) {
        errors.push('At least one condition group is required');
      }
      conditionGroups.value.forEach((group, gIdx) => {
        const label = `Group ${gIdx + 1}`;
        if (!group.collection) {
          errors.push(`${label}: Collection is required`);
        }
        if (group.type === 'simple') {
          const conds = group.conditions || [];
          if (!conds.length) {
            errors.push(`${label}: At least one condition is required`);
          }
          conds.forEach((c, cIdx) => {
            if (!c.field) {
              errors.push(`${label}, Condition ${cIdx + 1}: Field is required`);
            }
          });
        } else if (group.type === 'aggregate') {
          if (!group.aggregate) errors.push(`${label}: Aggregate function is required`);
          if (!group.field) errors.push(`${label}: Field is required`);
          if (!group.operator) errors.push(`${label}: Operator is required`);
          if (!group.value && group.value !== 0) errors.push(`${label}: Threshold value is required`);
        }
      });
      return errors;
    };

    const buildConditions = () => {
      const groups = conditionGroups.value.map(g => {
        const base = { type: g.type, collection: g.collection };
        if (g.type === 'simple') {
          base.conditions = (g.conditions || []).map(c => ({
            field: c.field,
            operator: c.operator,
            value: c.value,
          }));
        } else {
          base.aggregate = g.aggregate;
          base.field = g.field;
          base.operator = g.operator;
          base.value = g.value;
          if (g.time_range) base.time_range = g.time_range;
          if (g.time_field && g.time_field !== 'created_at') base.time_field = g.time_field;
        }
        return base;
      });
      return { groups };
    };

    const handleSave = () => {
      const errors = validate();
      validationErrors.value = errors;
      if (errors.length) return;

      isSaving.value = true;
      const conditions = buildConditions();
      const payload = {
        name: name.value.trim(),
        description: description.value?.trim() || '',
        conditions,
      };

      if (isEditing.value) {
        payload.audience_id = props.audience.id;
      }

      emit('save', payload);
      setTimeout(() => { isSaving.value = false; }, 500);
    };

    const handleCancel = () => {
      emit('cancel');
    };

    return {
      name,
      description,
      conditionGroups,
      validationErrors,
      isSaving,
      isEditing,
      safeCollections,
      nameError,
      addGroup,
      removeGroup,
      updateGroup,
      handleSave,
      handleCancel,
    };
  },
};
</script>

<style lang="scss" scoped>
.audience-builder-form {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-500);
}

.builder-header {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
  padding-bottom: var(--p-space-300);
  border-bottom: 1px solid var(--p-color-border);
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.04);
}

.builder-content {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.condition-builder-area {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
  background: var(--p-color-bg-surface-secondary);
  padding: var(--p-space-400);
  border-radius: var(--p-border-radius-200);
  margin: calc(-1 * var(--p-space-400));
  margin-top: 0;
}

.condition-groups {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.and-connector {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  padding: var(--p-space-200) 0;
}

.and-connector__line {
  flex: 1;
  height: 1px;
  background: var(--p-color-border);
}

.and-connector__badge {
  font-size: var(--p-font-size-300);
  font-weight: var(--p-font-weight-semibold);
  color: var(--p-color-text-secondary);
  background: var(--p-color-bg-surface);
  padding: var(--p-space-100) var(--p-space-300);
  border-radius: var(--p-border-radius-full);
  border: 1px solid var(--p-color-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.builder-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--p-space-200);
  padding-top: var(--p-space-400);
  border-top: 1px solid var(--p-color-border);
}

.error-list {
  margin: var(--p-space-100) 0 0;
  padding-left: var(--p-space-400);

  li {
    margin-bottom: var(--p-space-100);
  }

  li:last-child {
    margin-bottom: 0;
  }
}

input[type="radio"],
input[type="checkbox"] {
  accent-color: var(--p-color-bg-fill-brand, #2C6ECB);
}
</style>
