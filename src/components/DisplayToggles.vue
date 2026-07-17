<template>
  <div class="display-toggles">
    <span class="display-toggles-label">Display</span>
    <label class="switch-row">
      <span class="switch-label">Elevation</span>
      <button
        type="button"
        role="switch"
        :aria-checked="showElevation"
        class="ios-switch"
        :class="{ on: showElevation }"
        @click="$emit('toggle', 'showElevation')"
      ><span class="ios-switch-knob"></span></button>
    </label>
    <label class="switch-row">
      <span class="switch-label">Timezone</span>
      <button
        type="button"
        role="switch"
        :aria-checked="showTimezone"
        class="ios-switch"
        :class="{ on: showTimezone }"
        @click="$emit('toggle', 'showTimezone')"
      ><span class="ios-switch-knob"></span></button>
    </label>
    <label class="switch-row">
      <span class="switch-label">FIFA Seeding</span>
      <button
        type="button"
        role="switch"
        :aria-checked="showPot"
        class="ios-switch"
        :class="{ on: showPot }"
        @click="$emit('toggle', 'showPot')"
      ><span class="ios-switch-knob"></span></button>
    </label>
  </div>
</template>

<script>
// Lives inside BracketView.vue and ScheduleView.vue (the only two tabs
// these toggles actually affect) rather than in App.vue's shared toolbar —
// that way the toolbar itself never resizes when switching to the Insights
// tab. State is still owned by App.vue; this just renders it and emits
// which one got clicked, same prop-down/event-up pattern used everywhere
// else in the app (no store).
export default {
  emits: ['toggle'],

  props: {
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
  },
}
</script>
