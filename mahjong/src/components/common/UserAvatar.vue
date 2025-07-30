<template>
  <div 
    :class="[
      'user-avatar',
      `avatar--${size}`,
      { 'avatar--has-image': avatarUrl }
    ]"
  >
    <img 
      v-if="avatarUrl" 
      :src="avatarUrl" 
      :alt="`Avatar de ${username}`"
      @error="handleImageError"
      class="avatar__image"
    >
    <span v-else class="avatar__initial">
      {{ getInitial }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  avatarUrl?: string
  username: string
  size?: 'small' | 'medium' | 'large'
  showLevel?: boolean
  showOnline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showLevel: false,
  showOnline: false
})

const imageError = ref(false)

const getInitial = computed(() => {
  if (!props.username) return '?'
  return props.username.charAt(0).toUpperCase()
})

const handleImageError = () => {
  imageError.value = true
}
</script>

<script lang="ts">
export default {
  name: 'UserAvatar'
}
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* Tamanhos */
.avatar--small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.avatar--medium {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

.avatar--large {
  width: 64px;
  height: 64px;
  font-size: 28px;
}

/* Imagem do avatar */
.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Inicial de fallback */
.avatar__initial {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  user-select: none;
}

/* Estado com imagem */
.avatar--has-image {
  background: #f0f0f0;
}

/* Responsividade */
@media (max-width: 768px) {
  .avatar--large {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
}
</style>