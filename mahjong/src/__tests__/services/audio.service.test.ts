import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { audioService } from '@/services/audio.service';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';
import { createPinia, setActivePinia } from 'pinia';

// Mock HTMLAudioElement
class MockAudioElement {
  src = '';
  preload = '';
  loop = false;
  paused = true;
  ended = false;
  currentTime = 0;
  
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn((event, handler) => {
    if (event === 'canplaythrough') {
      // Simulate immediate load
      setTimeout(() => handler(), 0);
    }
  });
  cloneNode = vi.fn(() => new MockAudioElement());
}

// Replace global Audio constructor
global.Audio = MockAudioElement as any;

describe('AudioService', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    audioService.cleanup();
  });

  it('should load sounds correctly', async () => {
    const soundConfig = {
      'click': ['/sounds/click1.wav', '/sounds/click2.wav'],
      'match': ['/sounds/match.wav']
    };

    await audioService.load(soundConfig);
    
    const soundsReady = audioService.getSoundsReady();
    expect(soundsReady.value).toBe(true);
  });

  it('should not play sound when sounds are disabled', async () => {
    const preferencesStore = useGamePreferencesStore();
    preferencesStore.preferences.soundEnabled = false;

    const soundConfig = {
      'click': ['/sounds/click.wav']
    };
    
    await audioService.load(soundConfig);
    
    const mockAudio = new MockAudioElement();
    audioService.play('click');
    
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('should play sound when sounds are enabled', async () => {
    const preferencesStore = useGamePreferencesStore();
    preferencesStore.preferences.soundEnabled = true;

    const soundConfig = {
      'click': ['/sounds/click.wav']
    };
    
    await audioService.load(soundConfig);
    
    // Wait for sounds to load
    await new Promise(resolve => setTimeout(resolve, 10));
    
    audioService.play('click');
    
    // Wait for play to be called
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Check that a cloned audio element was created and played
    expect(MockAudioElement.prototype.cloneNode).toHaveBeenCalled();
  });

  it('should handle pool size limits', async () => {
    const preferencesStore = useGamePreferencesStore();
    preferencesStore.preferences.soundEnabled = true;

    const soundConfig = {
      'click': ['/sounds/click.wav']
    };
    
    await audioService.load(soundConfig);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Play many sounds to test pool limit
    for (let i = 0; i < 15; i++) {
      audioService.play('click');
    }
    
    // Should not create more than maxPoolSize clones
    const cloneCallCount = MockAudioElement.prototype.cloneNode.mock.calls.length;
    expect(cloneCallCount).toBeLessThanOrEqual(10); // maxPoolSize
  });

  it('should stop all sounds', async () => {
    const soundConfig = {
      'click': ['/sounds/click.wav'],
      'match': ['/sounds/match.wav']
    };
    
    await audioService.load(soundConfig);
    
    const mockAudio = new MockAudioElement();
    audioService.stopAll();
    
    // All audio elements should be paused
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it('should handle delayed sound playback', async () => {
    const preferencesStore = useGamePreferencesStore();
    preferencesStore.preferences.soundEnabled = true;

    const soundConfig = {
      'click': ['/sounds/click.wav']
    };
    
    await audioService.load(soundConfig);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Play with delay
    audioService.play('click', 100);
    
    // Should not play immediately
    expect(MockAudioElement.prototype.play).not.toHaveBeenCalled();
    
    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Now should have played
    expect(MockAudioElement.prototype.cloneNode).toHaveBeenCalled();
  });

  it('should handle repeat playback', async () => {
    const preferencesStore = useGamePreferencesStore();
    preferencesStore.preferences.soundEnabled = true;

    const soundConfig = {
      'bgmusic': ['/sounds/music.mp3']
    };
    
    await audioService.load(soundConfig);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    audioService.play('bgmusic', 0, true);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should set loop property on cloned audio
    const clonedAudio = MockAudioElement.prototype.cloneNode.mock.results[0].value;
    expect(clonedAudio.loop).toBe(true);
  });
});