<template>
  <div class="audience-builder-form">
    <!-- Header -->
    <div class="builder-header">
      <div class="builder-header__left">
        <PolarisButton variant="plain" icon="arrowLeft" @click="handleCancel">
          Back
        </PolarisButton>
        <PolarisText variant="headingLg">
          {{ isEditing ? 'Edit Audience' : 'Create Audience' }}
        </PolarisText>
      </div>
      <div class="builder-header__right">
        <PolarisButton @click="handleCancel">Cancel</PolarisButton>
        <PolarisButton variant="primary" @click="handleSave" :loading="isSaving">
          {{ isEditing ? 'Update Audience' : 'Create Audience' }}
        </PolarisButton>
      </div>
    </div>

    <div class="builder-scroll-area">
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
        <!-- Name & Description -->
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

        <!-- Conditions -->
        <div class="conditions-section">
          <PolarisBlockStack gap="100">
            <PolarisText variant="headingMd">Conditions</PolarisText>
            <PolarisText variant="bodySm" color="subdued">
              Users must satisfy ALL groups below to qualify for this audience.
            </PolarisText>
          </PolarisBlockStack>

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
                  :audiences="safeAudiences"
                  :groupIndex="idx"
                  @update="updateGroup(idx, $event)"
                  @remove="removeGroup(idx)"
                />
              </template>
            </div>

            <!-- Empty state -->
            <div v-if="!conditionGroups.length" class="conditions-empty">
              <div class="conditions-empty__icon">🎯</div>
              <PolarisText variant="headingSm">No conditions defined</PolarisText>
              <PolarisText variant="bodySm" color="subdued">
                Add at least one condition group to define who belongs in this audience.
              </PolarisText>
            </div>

            <!-- Add Group Button -->
            <PolarisButton variant="outline" icon="plus" fullWidth @click="addGroup">
              Add condition group
            </PolarisButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky footer for mobile -->
    <div class="builder-footer-mobile">
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
  PolarisBlockStack,
  PolarisTextField,
  PolarisBanner,
} from 'polaris-weweb-styles/components';
import ConditionGroupCard from './ConditionGroupCard.vue';

export default {
  name: 'AudienceBuilder',
  components: {
    PolarisText,
    PolarisButton,
    PolarisBlockStack,
    PolarisTextField,
    PolarisBanner,
    ConditionGroupCard,
  },
  props: {
    audience: { type: Object, default: null },
    collections: { type: Array, default: () => [] },
    audiences: { type: Array, default: () => [] },
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
    const safeAudiences = computed(() => Array.isArray(props.audiences) ? props.audiences : []);

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
          conditionGroups.value = groups.map(g => {
            const group = {
              ...g,
              id: g.id || makeGroupId(),
            };
            if (g.type === 'simple') {
              group.conditions = (g.conditions || []).map(c => ({
                ...c,
                id: c.id || `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              }));
            } else if (g.type === 'aggregate') {
              const agg = (typeof g.aggregate === 'object' && g.aggregate) ? g.aggregate : {};
              group.aggregate = agg.function || (typeof g.aggregate === 'string' ? g.aggregate : '');
              group.field = agg.field || g.field || '';
              group.operator = agg.operator || g.operator || 'gte';
              group.value = agg.value ?? g.value ?? '';
              const tr = agg.time_range || g.time_range;
              if (typeof tr === 'string' && tr) {
                const parts = tr.split(' ');
                group.time_range = { value: Number(parts[0]) || 0, unit: parts[1] || 'days' };
              } else if (tr && typeof tr === 'object') {
                group.time_range = tr;
              } else {
                group.time_range = null;
              }
              group.time_field = agg.time_field || g.time_field || 'created_at';
            }
            return group;
          });
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
        } else if (g.type === 'aggregate') {
          base.conditions = [];
          base.aggregate = {
            function: g.aggregate,
            field: g.field,
            operator: g.operator,
            value: g.value,
          };
          if (g.time_range && g.time_range?.value) {
            base.aggregate.time_range = g.time_range;
          }
          if (g.time_field && g.time_field !== 'created_at') {
            base.aggregate.time_field = g.time_field;
          }
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
      safeAudiences,
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
@import 'polaris-weweb-styles';

.audience-builder-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-400) var(--p-space-600);
  background: var(--p-color-bg-surface);
  border-bottom: 1px solid var(--p-color-border);
  flex-shrink: 0;
}

.builder-header__left {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
  min-width: 0;
}

.builder-header__right {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  margin-left: auto;
  flex-shrink: 0;
}

.builder-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--p-space-600);
  background: var(--p-color-bg-surface);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.builder-content {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-500);
  max-width: 720px;
}

.conditions-section {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
  background: var(--p-color-bg-surface-secondary);
  border-radius: var(--p-border-radius-200);
  padding: var(--p-space-400);
}

.condition-builder-area {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.conditions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-space-200);
  padding: var(--p-space-800) var(--p-space-400);
  text-align: center;
  background: var(--p-color-bg-surface-secondary);
  border-radius: var(--p-border-radius-300);

  &__icon {
    font-size: 28px;
  }
}

.condition-groups {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.and-connector {
  @include condition-group-connector;
}

.and-connector__line {
  @include condition-group-connector-line;
}

.and-connector__badge {
  @include condition-group-connector-badge;
}

.builder-footer-mobile {
  display: none;
}

@media (max-width: 768px) {
  .builder-header__right {
    display: none;
  }

  .builder-footer-mobile {
    display: flex;
    justify-content: flex-end;
    gap: var(--p-space-200);
    padding: var(--p-space-300) var(--p-space-400);
    border-top: 1px solid var(--p-color-border);
    flex-shrink: 0;
  }

  .builder-header {
    padding: var(--p-space-300) var(--p-space-400);
  }

  .builder-scroll-area {
    padding: var(--p-space-400);
  }

  .builder-content {
    max-width: none;
  }
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
</style>
