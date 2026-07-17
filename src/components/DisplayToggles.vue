<template>
  <div class="display-toggles">
    <span class="display-toggles-label">Display</span>
    <div class="toggles-divider"></div>
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
      <span class="switch-label"><span class="switch-label-full">FIFA Seeding</span><span class="switch-label-short">Seeding</span></span>
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
// Rendered by App.vue inside its own .toggles-bar, separate from the nav
// pill, and only when the active tab isn't Insights (the only two tabs
// these toggles actually affect). State is still owned by App.vue; this
// just renders it and emits which one got clicked, same prop-down/
// event-up pattern used everywhere else in the app (no store).
export default {
  emits: ['toggle'],

  props: {
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
  },
}
</script>
