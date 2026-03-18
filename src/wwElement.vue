<template>
  <div class="audience-root">
    <!-- List View -->
    <AudienceList
      v-if="currentViewValue === 'list'"
      :audiences="audiencesData"
      :loading="isLoading"
      @create="handleCreateNew"
      @view="handleViewDetail"
      @edit="handleEdit"
      @toggle-status="handleToggleStatus"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />

    <!-- Builder View (Create / Edit) -->
    <AudienceBuilder
      v-else-if="currentViewValue === 'builder'"
      :audience="editingAudienceObj"
      :collections="collectionsData"
      :audiences="audiencesData"
      @save="handleSave"
      @cancel="handleBackToList"
    />

    <!-- Detail View -->
    <AudienceDetail
      v-else-if="currentViewValue === 'detail'"
      :audience="selectedAudienceObj"
      :members="membersData"
      :membersTotal="membersTotalData"
      @edit="handleEdit"
      @toggle-status="handleToggleStatus"
      @delete="handleDeleteFromDetail"
      @load-members="handleLoadMembers"
      @back="handleBackToList"
    />

    <!-- Editor Placeholder -->
    <div v-else class="editor-placeholder">
      <!-- wwEditor:start -->
      <div class="editor-placeholder__content">
        <div class="editor-placeholder__icon">🎯</div>
        <PolarisText variant="headingMd">Audience Builder</PolarisText>
        <PolarisText variant="bodySm" color="subdued">
          Bind the <strong>Auth Token (JWT)</strong> in the settings panel to get started.
        </PolarisText>
        <div class="editor-placeholder__badges">
          <PolarisBadge variant="info">📋 List</PolarisBadge>
          <PolarisBadge variant="success">🛠 Builder</PolarisBadge>
          <PolarisBadge variant="attention">👥 Detail</PolarisBadge>
        </div>
      </div>
      <!-- wwEditor:end -->
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue';
import {
  PolarisText,
  PolarisBadge,
} from 'polaris-weweb-styles/components';
import AudienceList from './components/AudienceList.vue';
import AudienceBuilder from './components/AudienceBuilder.vue';
import AudienceDetail from './components/AudienceDetail.vue';

const SUPABASE_URL = 'https://wkevmsedchftztoolkmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZXZtc2VkY2hmdHp0b29sa21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTM2OTgsImV4cCI6MjA2NjA4OTY5OH0.bd8ELGtX8ACmk_WCxR_tIFljwyHgD3YD4PdBDpD-kSM';

export default {
  components: {
    PolarisText,
    PolarisBadge,
    AudienceList,
    AudienceBuilder,
    AudienceDetail,
  },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit, expose }) {
    const editingAudience = ref(null);
    const isLoading = ref(false);
    const audiences = ref([]);
    const collections = ref([]);
    const members = ref([]);
    const membersTotal = ref(0);

    // ── Supabase Helpers ──
    const authToken = computed(() => props.content?.authToken || '');

    const headers = computed(() => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken.value}`,
      'apikey': SUPABASE_ANON_KEY,
    }));

    const rpc = async (functionName, body = {}) => {
      if (!authToken.value) return null;
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
          method: 'POST',
          headers: headers.value,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`RPC ${functionName} failed: ${res.status} ${text}`);
        }
        const data = await res.json();
        if (data && typeof data === 'object' && 'success' in data && data.success === false) {
          throw new Error(data.title || data.description || `${functionName} failed`);
        }
        return data;
      } catch (err) {
        console.error(`[AudienceBuilder] RPC ${functionName} error:`, err);
        emit('trigger-event', { name: 'error', event: { message: err?.message || String(err), code: functionName } });
        throw err;
      }
    };

    // ── Internal Variables ──
    const { value: currentView, setValue: setCurrentView } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentView',
      type: 'string',
      defaultValue: 'list',
    });

    const { value: selectedAudienceId, setValue: setSelectedAudienceId } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedAudienceId',
      type: 'string',
      defaultValue: '',
    });

    const { value: editingConditions, setValue: setEditingConditions } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'editingConditions',
      type: 'object',
      defaultValue: null,
    });

    const { value: hasUnsavedChanges, setValue: setHasUnsavedChanges } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'hasUnsavedChanges',
      type: 'boolean',
      defaultValue: false,
    });

    const { value: audienceCountVar, setValue: setAudienceCount } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'audienceCount',
      type: 'number',
      defaultValue: 0,
    });

    // ── Computed Data ──
    const currentViewValue = computed(() => currentView.value || 'list');
    const audiencesData = computed(() => audiences.value);
    const collectionsData = computed(() => collections.value);
    const membersData = computed(() => members.value);
    const membersTotalData = computed(() => membersTotal.value);

    const selectedAudienceObj = computed(() => {
      const id = selectedAudienceId.value;
      if (!id) return null;
      return audiences.value.find(a => a?.id === id) || null;
    });

    const editingAudienceObj = computed(() => editingAudience.value);

    // ── Data Fetching ──
    const fetchAudiences = async () => {
      if (!authToken.value) return;
      isLoading.value = true;
      try {
        const result = await rpc('bff_list_audiences');
        const data = result?.success ? (result?.data || []) : (Array.isArray(result) ? result : []);
        audiences.value = data;
        setAudienceCount(data.length);
        emit('trigger-event', { name: 'data-loaded', event: { audienceCount: data.length } });
      } catch (err) {
        audiences.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const fetchCollections = async () => {
      if (!authToken.value) return;
      try {
        const data = await rpc('bff_get_workflow_collections');
        if (Array.isArray(data)) {
          collections.value = data;
        } else if (data?.collections) {
          collections.value = data.collections;
        }
      } catch (err) {
        collections.value = [];
      }
    };

    const fetchMembers = async (audienceId, limit = 50, offset = 0, includeExited = false) => {
      if (!authToken.value || !audienceId) return;
      try {
        const result = await rpc('bff_get_audience_members', {
          p_audience_id: audienceId,
          p_limit: limit,
          p_offset: offset,
          p_include_exited: includeExited,
        });
        if (result?.success) {
          members.value = result?.data || [];
          membersTotal.value = result?.total || result?.data?.length || 0;
        } else {
          members.value = Array.isArray(result?.data) ? result.data : [];
          membersTotal.value = result?.total || 0;
        }
      } catch (err) {
        members.value = [];
        membersTotal.value = 0;
      }
    };

    // ── Init ──
    const initData = async () => {
      if (!authToken.value) return;
      await Promise.all([
        fetchAudiences(),
        fetchCollections(),
      ]);
    };

    onMounted(() => {
      initData();
    });

    watch(
      () => props.content?.authToken,
      (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          initData();
        }
      },
    );

    // ── Navigation ──
    const navigateTo = (view, audienceId = '') => {
      setCurrentView(view);
      if (audienceId) {
        setSelectedAudienceId(audienceId);
      }
      emit('trigger-event', {
        name: 'view-changed',
        event: { view, audienceId },
      });
    };

    const handleBackToList = () => {
      editingAudience.value = null;
      setEditingConditions(null);
      setHasUnsavedChanges(false);
      members.value = [];
      membersTotal.value = 0;
      navigateTo('list');
      fetchAudiences();
    };

    const handleCreateNew = () => {
      editingAudience.value = null;
      setEditingConditions(null);
      navigateTo('builder');
    };

    const handleEdit = (audience) => {
      editingAudience.value = audience ? { ...audience } : null;
      setEditingConditions(audience?.conditions || null);
      navigateTo('builder', audience?.id || '');
    };

    const handleViewDetail = (audience) => {
      navigateTo('detail', audience?.id || '');
      if (audience?.id) {
        fetchMembers(audience.id);
      }
    };

    // ── API Actions (direct Supabase calls) ──
    const handleSave = async (payload) => {
      try {
        if (payload.audience_id) {
          await rpc('bff_update_audience', {
            p_audience_id: payload.audience_id,
            p_name: payload.name,
            p_description: payload.description || null,
            p_conditions: payload.conditions || { groups: [] },
          });
          emit('trigger-event', {
            name: 'audience-saved',
            event: { audience_id: payload.audience_id, name: payload.name, action: 'updated' },
          });
        } else {
          const result = await rpc('bff_create_audience', {
            p_name: payload.name,
            p_description: payload.description || null,
            p_conditions: payload.conditions || { groups: [] },
          });
          const newId = result?.data?.id || result?.id || '';
          emit('trigger-event', {
            name: 'audience-saved',
            event: { audience_id: newId, name: payload.name, action: 'created' },
          });
        }
        setHasUnsavedChanges(false);
        handleBackToList();
      } catch (err) {
        // Error already emitted by rpc helper
      }
    };

    const handleToggleStatus = async (audience) => {
      if (!audience?.id) return;
      try {
        if (audience?.is_active) {
          await rpc('bff_deactivate_audience', { p_audience_id: audience.id });
          emit('trigger-event', {
            name: 'audience-status-changed',
            event: { audience_id: audience.id, is_active: false },
          });
        } else {
          await rpc('bff_activate_audience', { p_audience_id: audience.id, p_run_backfill: true });
          emit('trigger-event', {
            name: 'audience-status-changed',
            event: { audience_id: audience.id, is_active: true },
          });
        }
        await fetchAudiences();
      } catch (err) {
        // Error already emitted by rpc helper
      }
    };

    const handleDelete = async (audience) => {
      if (!audience?.id) return;
      try {
        await rpc('bff_delete_audience', { p_audience_id: audience.id });
        emit('trigger-event', {
          name: 'audience-deleted',
          event: { audience_id: audience.id },
        });
        await fetchAudiences();
      } catch (err) {
        // Error already emitted by rpc helper
      }
    };

    const handleDeleteFromDetail = async (audience) => {
      await handleDelete(audience);
      handleBackToList();
    };

    const handleRefresh = () => {
      fetchAudiences();
    };

    const handleLoadMembers = (params) => {
      fetchMembers(
        params?.audience_id || selectedAudienceId.value,
        params?.limit || 50,
        params?.offset || 0,
        params?.include_exited || false,
      );
    };

    // ── Exposed Actions ──
    const navigateToList = () => handleBackToList();

    const navigateToBuilder = (audienceData) => {
      if (audienceData && typeof audienceData === 'object' && audienceData.id) {
        handleEdit(audienceData);
      } else {
        handleCreateNew();
      }
    };

    const navigateToDetail = (audienceId) => {
      if (audienceId) {
        navigateTo('detail', audienceId);
        fetchMembers(audienceId);
      }
    };

    const refreshData = () => initData();

    expose({
      navigateToList,
      navigateToBuilder,
      navigateToDetail,
      refreshData,
    });

    return {
      currentViewValue,
      audiencesData,
      collectionsData,
      membersData,
      membersTotalData,
      selectedAudienceObj,
      editingAudienceObj,
      isLoading,
      handleBackToList,
      handleCreateNew,
      handleEdit,
      handleViewDetail,
      handleSave,
      handleToggleStatus,
      handleDelete,
      handleDeleteFromDetail,
      handleRefresh,
      handleLoadMembers,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.audience-root {
  @include polaris-tokens;
  width: 100%;
  height: 100%;
  font-family: var(--p-font-family-sans);
  color: var(--p-color-text);
  background: var(--p-color-bg-surface-secondary);
  padding: var(--p-space-600) var(--p-space-800);
  overflow-y: auto;
  box-sizing: border-box;

  :deep(input[type="radio"]),
  :deep(input[type="checkbox"]) {
    accent-color: var(--p-color-bg-fill-brand, #2C6ECB);
  }
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.editor-placeholder__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-space-300);
  text-align: center;
  max-width: 400px;
}

.editor-placeholder__icon {
  font-size: 48px;
}

.editor-placeholder__badges {
  display: flex;
  gap: var(--p-space-200);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--p-space-200);
}

@media (max-width: 768px) {
  .audience-root {
    padding: var(--p-space-400);
  }
}
</style>
