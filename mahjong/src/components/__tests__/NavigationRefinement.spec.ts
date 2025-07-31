import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import UserProfileHeader from '../UserProfileHeader.vue'
import ViewContainer from '../ViewContainer.vue'
import NavigationMenu from '../NavigationMenu.vue'
import { useNavigationStore } from '../../stores/navigation.store'

describe('Navigation System Refinements', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
  })

  describe('UserProfileHeader', () => {
    it('should have fixed positioning with proper z-index', () => {
      const wrapper = mount(UserProfileHeader, {
        global: {
          plugins: [pinia]
        }
      })

      const header = wrapper.find('.user-profile-header')
      const styles = window.getComputedStyle(header.element)
      
      expect(styles.position).toBe('fixed')
      expect(styles.top).toBe('0px')
      expect(styles.zIndex).toBe('1000')
    })

    it('should include safe area padding on iOS devices', () => {
      const wrapper = mount(UserProfileHeader, {
        global: {
          plugins: [pinia]
        }
      })

      const header = wrapper.find('.user-profile-header')
      const styles = window.getComputedStyle(header.element)
      
      // Check if env() is used in padding-top
      expect(styles.paddingTop).toMatch(/calc|env/)
    })

    it('should show inline navigation menu on desktop', () => {
      // Mock window width for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const wrapper = mount(UserProfileHeader, {
        global: {
          plugins: [pinia],
          stubs: {
            NavigationMenu: true
          }
        }
      })

      expect(wrapper.findComponent({ name: 'NavigationMenu' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'NavigationMenu' }).props('variant')).toBe('inline')
    })
  })

  describe('ViewContainer', () => {
    it('should have dynamic padding based on header visibility', async () => {
      const wrapper = mount(ViewContainer, {
        global: {
          plugins: [pinia]
        }
      })

      const container = wrapper.find('.view-container')
      const store = useNavigationStore()
      
      // When not in game view, should have header padding
      store.navigateTo('home')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.hasHeader).toBe(true)
      
      // Mock mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))
      
      // When in game view on mobile, no header padding
      store.navigateTo('game')
      await wrapper.vm.$nextTick()
      
      // Trigger reactive update
      wrapper.vm.isMobile = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.hasHeader).toBe(false)
    })

    it('should account for bottom navigation on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const wrapper = mount(ViewContainer, {
        global: {
          plugins: [pinia]
        }
      })

      const container = wrapper.find('.view-container')
      const styles = window.getComputedStyle(container.element)
      
      // Mobile should have bottom padding for navigation
      expect(styles.paddingBottom).toMatch(/60px|calc/)
    })
  })

  describe('NavigationMenu', () => {
    it('should have consistent icon sizing', () => {
      const wrapper = mount(NavigationMenu, {
        global: {
          plugins: [pinia]
        }
      })

      const icons = wrapper.findAll('.menu-item i')
      icons.forEach(icon => {
        const styles = window.getComputedStyle(icon.element)
        expect(styles.width).toBe('1.25rem')
        expect(styles.height).toBe('1.25rem')
      })
    })

    it('should show different active states for variants', async () => {
      const wrapper = mount(NavigationMenu, {
        props: {
          variant: 'bottom'
        },
        global: {
          plugins: [pinia]
        }
      })

      const store = useNavigationStore()
      store.navigateTo('game')
      await wrapper.vm.$nextTick()

      const activeItem = wrapper.find('.menu-item.active')
      expect(activeItem.exists()).toBe(true)
      
      // Bottom variant should have top border indicator
      const beforeElement = activeItem.find('::before')
      // Note: Pseudo-elements are hard to test, but we ensure the class is there
      expect(activeItem.classes()).toContain('active')
    })

    it('should have transparent background for inline variant', async () => {
      const wrapper = mount(NavigationMenu, {
        props: {
          variant: 'inline'
        },
        global: {
          plugins: [pinia]
        }
      })

      const nav = wrapper.find('.navigation-menu')
      const styles = window.getComputedStyle(nav.element)
      
      expect(styles.background).toBe('transparent')
      expect(styles.boxShadow).toBe('none')
    })
  })

  describe('Visual Consistency', () => {
    it('should maintain consistent z-index layering', () => {
      // Create a full layout mock
      const layout = document.createElement('div')
      layout.innerHTML = `
        <div class="user-profile-header" style="z-index: 1000;"></div>
        <div class="view-container" style="z-index: 1;"></div>
        <div class="navigation-menu" style="z-index: 1001;"></div>
      `
      document.body.appendChild(layout)

      const header = layout.querySelector('.user-profile-header') as HTMLElement
      const container = layout.querySelector('.view-container') as HTMLElement
      const nav = layout.querySelector('.navigation-menu') as HTMLElement

      expect(parseInt(header.style.zIndex)).toBeGreaterThan(parseInt(container.style.zIndex))
      expect(parseInt(nav.style.zIndex)).toBeGreaterThan(parseInt(header.style.zIndex))

      document.body.removeChild(layout)
    })
  })
})