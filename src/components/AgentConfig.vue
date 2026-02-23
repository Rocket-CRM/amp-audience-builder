<template>
  <div class="agent-config">
    <!-- ==================== GOALS SECTION ==================== -->
    <div class="config-section">
      <div class="config-section__header">
        <span class="config-section__icon">🎯</span>
        <h3 class="config-section__title">Goals</h3>
      </div>
      <div class="config-section__content">
        <!-- Objective -->
        <div class="polaris-text-field">
          <label class="polaris-text-field__label polaris-text-field__label--required">Objective</label>
          <select
            class="polaris-select__input"
            :value="config?.objective || ''"
            @change="updateField('objective', $event.target.value)"
          >
            <option value="">Select objective...</option>
            <option
              v-for="obj in safeObjectives"
              :key="obj?.value"
              :value="obj?.value"
            >{{ obj?.label || obj?.value }}</option>
          </select>
          <span class="polaris-text-field__help-text">What should the AI agent accomplish?</span>
        </div>

        <!-- Tone -->
        <div class="polaris-text-field">
          <label class="polaris-text-field__label polaris-text-field__label--required">Tone</label>
          <select
            class="polaris-select__input"
            :value="config?.tone || 'friendly'"
            @change="updateField('tone', $event.target.value)"
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="empathetic">Empathetic</option>
          </select>
          <span class="polaris-text-field__help-text">Communication style for the AI agent</span>
        </div>
      </div>
    </div>

    <!-- ==================== ACTIONS SECTION ==================== -->
    <div class="config-section">
      <div class="config-section__header">
        <span class="config-section__icon">⚡</span>
        <h3 class="config-section__title">Actions</h3>
        <span class="config-section__subtitle">Restrict which actions the AI can take</span>
      </div>
      <div class="config-section__content">
        <div class="actions-grid">
          <label
            v-for="action in safeAvailableActions"
            :key="action?.value"
            class="action-checkbox"
          >
            <input
              type="checkbox"
              :checked="isActionAllowed(action?.value)"
              @change="toggleAction(action?.value, $event.target.checked)"
            />
            <span class="action-checkbox__label">{{ action?.label || action?.value }}</span>
          </label>
        </div>
        <div v-if="!safeAvailableActions.length" class="polaris-empty-state polaris-empty-state--small">
          <span class="polaris-text polaris-text--subdued">No actions configured. Bind available actions from your workflow.</span>
        </div>
      </div>
    </div>

    <!-- ==================== CONSTRAINTS SECTION ==================== -->
    <div class="config-section">
      <div class="config-section__header">
        <span class="config-section__icon">🔒</span>
        <h3 class="config-section__title">Constraints</h3>
        <span class="config-section__subtitle">Limit AI behavior and resource usage</span>
      </div>
      <div class="config-section__content">
        <!-- Max Points Per User -->
        <div class="constraint-row">
          <div class="constraint-row__main">
            <div class="polaris-text-field polaris-text-field--flex">
              <label class="polaris-text-field__label">Max Points Per User</label>
              <input
                class="polaris-text-field__input"
                type="number"
                min="0"
                :value="config?.max_points_per_user ?? ''"
                placeholder="No limit"
                @input="updateField('max_points_per_user', $event.target.value ? Number($event.target.value) : null)"
              />
            </div>
          </div>
          <div class="constraint-row__options">
            <!-- Metric Scope -->
            <div class="polaris-text-field polaris-text-field--compact">
              <label class="polaris-text-field__label polaris-text-field__label--small">Scope</label>
              <select
                class="polaris-select__input polaris-select__input--small"
                :value="config?.max_points_scope || 'per_execution'"
                @change="updateField('max_points_scope', $event.target.value)"
              >
                <option value="per_execution">Per Execution</option>
                <option value="per_user_lifetime">Per User (Lifetime)</option>
                <option value="per_user_period">Per User (Period)</option>
              </select>
            </div>
            <!-- Time Group (only show if scope is per_user_period) -->
            <div 
              v-if="config?.max_points_scope === 'per_user_period'"
              class="polaris-text-field polaris-text-field--compact"
            >
              <label class="polaris-text-field__label polaris-text-field__label--small">Period</label>
              <select
                class="polaris-select__input polaris-select__input--small"
                :value="config?.max_points_period || 'day'"
                @change="updateField('max_points_period', $event.target.value)"
              >
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
              </select>
            </div>
          </div>
          <span class="polaris-text-field__help-text">Leave empty for no limit</span>
        </div>

        <!-- Max Actions Per Execution -->
        <div class="constraint-row">
          <div class="constraint-row__main">
            <div class="polaris-text-field polaris-text-field--flex">
              <label class="polaris-text-field__label">Max Actions Per Execution</label>
              <input
                class="polaris-text-field__input"
                type="number"
                min="0"
                :value="config?.max_actions_per_execution ?? ''"
                placeholder="No limit"
                @input="updateField('max_actions_per_execution', $event.target.value ? Number($event.target.value) : null)"
              />
            </div>
          </div>
          <div class="constraint-row__options">
            <!-- Metric Scope -->
            <div class="polaris-text-field polaris-text-field--compact">
              <label class="polaris-text-field__label polaris-text-field__label--small">Scope</label>
              <select
                class="polaris-select__input polaris-select__input--small"
                :value="config?.max_actions_scope || 'per_execution'"
                @change="updateField('max_actions_scope', $event.target.value)"
              >
                <option value="per_execution">Per Execution</option>
                <option value="per_user_lifetime">Per User (Lifetime)</option>
                <option value="per_user_period">Per User (Period)</option>
              </select>
            </div>
            <!-- Time Group (only show if scope is per_user_period) -->
            <div 
              v-if="config?.max_actions_scope === 'per_user_period'"
              class="polaris-text-field polaris-text-field--compact"
            >
              <label class="polaris-text-field__label polaris-text-field__label--small">Period</label>
              <select
                class="polaris-select__input polaris-select__input--small"
                :value="config?.max_actions_period || 'day'"
                @change="updateField('max_actions_period', $event.target.value)"
              >
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
              </select>
            </div>
          </div>
          <span class="polaris-text-field__help-text">How many actions the AI can take in a single run</span>
        </div>

        <!-- Context Hint -->
        <div class="polaris-text-field">
          <label class="polaris-text-field__label">Context Hint</label>
          <textarea
            class="polaris-text-field__input polaris-text-field__input--multiline"
            rows="3"
            :value="config?.context_hint || ''"
            placeholder="e.g., These are lapsed VIP customers who used to spend heavily"
            @input="updateField('context_hint', $event.target.value)"
          ></textarea>
          <span class="polaris-text-field__help-text">Additional context passed to the AI to improve decisions</span>
        </div>
      </div>
    </div>

    <!-- ==================== OUTPUT VARIABLES SECTION ==================== -->
    <div class="config-section config-section--collapsible">
      <button 
        class="config-section__header config-section__header--clickable"
        @click="toggleOutputSection"
      >
        <span class="config-section__icon">📤</span>
        <h3 class="config-section__title">Agent Output Variables</h3>
        <span class="config-section__chevron" :class="{ 'config-section__chevron--open': showOutputSection }">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </span>
      </button>
      <div v-if="showOutputSection" class="config-section__content">
        <div class="output-variables">
          <div
            v-for="(variable, idx) in (config?.output_variables || [])"
            :key="variable?.name || idx"
            class="output-variable"
          >
            <div class="output-variable__row">
              <div class="polaris-text-field polaris-text-field--flex">
                <label class="polaris-text-field__label polaris-text-field__label--small">Name</label>
                <input
                  class="polaris-text-field__input"
                  type="text"
                  :value="variable?.name || ''"
                  placeholder="Variable name"
                  @input="updateOutputVariable(idx, 'name', $event.target.value)"
                />
              </div>
              <div class="polaris-text-field polaris-text-field--type">
                <label class="polaris-text-field__label polaris-text-field__label--small">Type</label>
                <select
                  class="polaris-select__input"
                  :value="variable?.type || 'string'"
                  @change="updateOutputVariable(idx, 'type', $event.target.value)"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </select>
              </div>
              <button
                class="polaris-button polaris-button--plain polaris-button--critical polaris-button--icon-only"
                @click="removeOutputVariable(idx)"
              >
                <span class="polaris-icon polaris-icon--small">✕</span>
              </button>
            </div>
            <div class="polaris-text-field">
              <label class="polaris-text-field__label polaris-text-field__label--small">Description</label>
              <input
                class="polaris-text-field__input"
                type="text"
                :value="variable?.description || ''"
                placeholder="What this variable captures..."
                @input="updateOutputVariable(idx, 'description', $event.target.value)"
              />
            </div>
          </div>
          <button
            class="polaris-button polaris-button--outline polaris-button--slim polaris-button--full-width"
            @click="addOutputVariable"
          >+ Add Output Variable</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'AgentConfig',
  props: {
    config: { type: Object, required: true },
    objectives: { type: Array, default: () => [] },
    availableActions: { type: Array, default: () => [] },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const showOutputSection = ref(false);

    const safeObjectives = computed(() => {
      return Array.isArray(props.objectives) ? props.objectives : [];
    });

    const safeAvailableActions = computed(() => {
      return Array.isArray(props.availableActions) ? props.availableActions : [];
    });

    const emitUpdate = (newConfig) => {
      emit('update', newConfig);
    };

    const updateField = (field, value) => {
      emitUpdate({ ...props.config, [field]: value });
    };

    const isActionAllowed = (actionValue) => {
      const allowed = props.config?.allowed_actions || [];
      return Array.isArray(allowed) && allowed.includes(actionValue);
    };

    const toggleAction = (actionValue, checked) => {
      const currentAllowed = Array.isArray(props.config?.allowed_actions) 
        ? [...props.config.allowed_actions] 
        : [];
      
      if (checked && !currentAllowed.includes(actionValue)) {
        currentAllowed.push(actionValue);
      } else if (!checked) {
        const idx = currentAllowed.indexOf(actionValue);
        if (idx > -1) currentAllowed.splice(idx, 1);
      }
      
      emitUpdate({ ...props.config, allowed_actions: currentAllowed });
    };

    const toggleOutputSection = () => {
      showOutputSection.value = !showOutputSection.value;
    };

    const addOutputVariable = () => {
      const variables = [...(props.config?.output_variables || [])];
      variables.push({
        name: '',
        type: 'string',
        description: '',
      });
      emitUpdate({ ...props.config, output_variables: variables });
    };

    const removeOutputVariable = (idx) => {
      const variables = [...(props.config?.output_variables || [])];
      variables.splice(idx, 1);
      emitUpdate({ ...props.config, output_variables: variables });
    };

    const updateOutputVariable = (idx, field, value) => {
      const variables = [...(props.config?.output_variables || [])];
      if (variables[idx]) {
        variables[idx] = { ...variables[idx], [field]: value };
        emitUpdate({ ...props.config, output_variables: variables });
      }
    };

    return {
      showOutputSection,
      safeObjectives,
      safeAvailableActions,
      updateField,
      isActionAllowed,
      toggleAction,
      toggleOutputSection,
      addOutputVariable,
      removeOutputVariable,
      updateOutputVariable,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.agent-config {
  @include polaris-tokens;
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

// ==================== SECTION STYLING ====================
.config-section {
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
  overflow: hidden;
}

.config-section__header {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  padding: var(--p-space-300) var(--p-space-400);
  background: var(--p-color-bg-surface-secondary);
  border-bottom: 1px solid var(--p-color-border);

  &--clickable {
    cursor: pointer;
    width: 100%;
    border: none;
    text-align: left;
    font-family: inherit;
    
    &:hover {
      background: var(--p-color-bg-surface-hover);
    }
  }
}

.config-section__icon {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-section__title {
  @include polaris-text-heading-sm;
  margin: 0;
  flex: 1;
}

.config-section__subtitle {
  @include polaris-text-body;
  color: var(--p-color-text-secondary);
  font-size: var(--p-font-size-275);
}

.config-section__chevron {
  color: var(--p-color-icon);
  transition: transform 0.2s ease;
  
  &--open {
    transform: rotate(180deg);
  }
}

.config-section__content {
  padding: var(--p-space-400);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

// ==================== ACTIONS GRID ====================
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--p-space-200);
}

.action-checkbox {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  padding: var(--p-space-200) var(--p-space-300);
  background: var(--p-color-bg-surface-secondary);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--p-color-border-hover);
    background: var(--p-color-bg-surface-hover);
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--p-color-bg-fill-brand);
    cursor: pointer;
  }

  &__label {
    @include polaris-text-body;
    font-size: var(--p-font-size-300);
  }
}

// ==================== CONSTRAINT ROW ====================
.constraint-row {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);
  padding: var(--p-space-300);
  background: var(--p-color-bg-surface-secondary);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);

  &__main {
    display: flex;
    gap: var(--p-space-300);
  }

  &__options {
    display: flex;
    gap: var(--p-space-200);
    padding-top: var(--p-space-200);
    border-top: 1px dashed var(--p-color-border);
  }
}

// ==================== OUTPUT VARIABLES ====================
.output-variables {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);
}

.output-variable {
  padding: var(--p-space-300);
  background: var(--p-color-bg-surface-secondary);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  display: flex;
  flex-direction: column;
  gap: var(--p-space-200);

  &__row {
    display: flex;
    gap: var(--p-space-200);
    align-items: flex-end;
  }
}

// ==================== FORM ELEMENTS ====================
.polaris-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
  
  &--flex { flex: 1; }
  &--type { width: 100px; flex-shrink: 0; }
  &--compact { min-width: 120px; }
}

.polaris-text-field__label {
  @include polaris-label;
  
  &--required::after {
    content: ' *';
    color: var(--p-color-text-critical);
  }
  
  &--small {
    font-size: var(--p-font-size-275);
  }
}

.polaris-text-field__input {
  @include polaris-input;
  
  &--multiline {
    @include polaris-textarea;
    resize: vertical;
  }
}

.polaris-text-field__help-text {
  @include polaris-help-text;
}

.polaris-select__input {
  @include polaris-select;
  
  &--small {
    padding: var(--p-space-150) var(--p-space-200);
    font-size: var(--p-font-size-275);
  }
}

// ==================== BUTTONS ====================
.polaris-button {
  @include polaris-button-base;
  
  &--plain { @include polaris-button-plain; }
  &--critical { color: var(--p-color-text-critical); }
  &--outline { @include polaris-button-outline; }
  &--slim { @include polaris-button-slim; }
  &--full-width { @include polaris-button-full-width; }
  &--icon-only { @include polaris-button-icon-only; }
}

.polaris-icon {
  @include polaris-icon;
  &--small { @include polaris-icon-small; }
}

// ==================== EMPTY STATE ====================
.polaris-empty-state {
  @include polaris-empty-state;
  
  &--small {
    min-height: auto;
    padding: var(--p-space-400);
  }
}

.polaris-text {
  &--subdued { color: var(--p-color-text-secondary); }
}
</style>
