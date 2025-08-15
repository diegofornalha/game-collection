<template>
  <div class="streak-calendar">
    <!-- Header do Calendário -->
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-button">‹</button>
      <h2 class="month-year">{{ monthYearDisplay }}</h2>
      <button @click="nextMonth" class="nav-button">›</button>
    </div>

    <!-- Dias da Semana -->
    <div class="weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday">
        {{ day }}
      </div>
    </div>

    <!-- Dias do Mês -->
    <div class="days-grid">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="getDayClasses(day)"
        @click="day && selectDay(day)"
      >
        <span v-if="day" class="day-number">{{ day.day }}</span>
        <div v-if="day && day.hasStreak" class="streak-indicator">
          🔥
        </div>
      </div>
    </div>

    <!-- Informações da Ofensiva -->
    <div class="streak-info">
      <div class="streak-stat">
        <span class="stat-label">Ofensiva Atual</span>
        <span class="stat-value">{{ currentStreak }} {{ currentStreak === 1 ? 'dia' : 'dias' }}</span>
      </div>
      <div class="streak-stat">
        <span class="stat-label">Maior Ofensiva</span>
        <span class="stat-value">{{ bestStreak }} {{ bestStreak === 1 ? 'dia' : 'dias' }}</span>
      </div>
    </div>

    <!-- Botão Jogar -->
    <button @click="playGame" class="play-button">
      Jogar
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDailyStreakStore } from '@/stores/gamification/dailyStreak.store';
import { useNavigationStore } from '@/stores/navigation.store';

const dailyStreakStore = useDailyStreakStore();
const navigationStore = useNavigationStore();

// Estado do calendário
const currentDate = ref(new Date());
const selectedDate = ref<Date | null>(null);

// Dias da semana abreviados
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Computed para exibição do mês/ano
const monthYearDisplay = computed(() => {
  const month = currentDate.value.toLocaleDateString('pt-BR', { month: 'long' });
  const year = currentDate.value.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
});

// Computed para ofensivas
const currentStreak = computed(() => dailyStreakStore.streakData.currentStreak);
const bestStreak = computed(() => dailyStreakStore.streakData.bestStreak);

// Interface para os dias do calendário
interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasStreak: boolean;
  isSelected: boolean;
}

// Computed para gerar os dias do calendário
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  
  const days: (CalendarDay | null)[] = [];
  
  // Adicionar dias vazios no início
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  
  // Adicionar dias do mês
  const today = new Date();
  const streakHistory = dailyStreakStore.streakData.history || [];
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    days.push({
      day,
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      hasStreak: hasStreakOnDate(dateStr, streakHistory),
      isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false
    });
  }
  
  return days;
});

// Verificar se duas datas são o mesmo dia
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

// Verificar se há ofensiva em uma data específica
function hasStreakOnDate(dateStr: string, history: any[]): boolean {
  // Se for hoje e há ofensiva ativa
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today && dailyStreakStore.isStreakActive) {
    return true;
  }
  
  // Verificar no histórico
  return history.some(entry => entry.date === dateStr);
}

// Obter classes CSS para um dia
function getDayClasses(day: CalendarDay | null) {
  if (!day) return 'day empty';
  
  return [
    'day',
    day.isCurrentMonth && 'current-month',
    day.isToday && 'today',
    day.hasStreak && 'has-streak',
    day.isSelected && 'selected'
  ].filter(Boolean).join(' ');
}

// Navegação do calendário
function previousMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
}

// Selecionar um dia
function selectDay(day: CalendarDay) {
  selectedDate.value = day.date;
}

// Ir para o jogo
function playGame() {
  navigationStore.navigateTo('game');
}

// Inicializar
onMounted(() => {
  // Garantir que os dados de ofensiva estejam carregados
  if (!dailyStreakStore.streakData.lastPlayedDate) {
    dailyStreakStore.initializeStreak();
  }
});
</script>

<style scoped>
.streak-calendar {
  background: linear-gradient(135deg, #2c1810 0%, #3d2418 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 400px;
  margin: 0 auto;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

/* Header do Calendário */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
}

.month-year {
  font-size: 1.4em;
  font-weight: bold;
  color: #FFD700;
  text-transform: capitalize;
  margin: 0;
}

.nav-button {
  background: none;
  border: none;
  color: #FFD700;
  font-size: 1.8em;
  cursor: pointer;
  padding: 0 10px;
  transition: transform 0.2s;
}

.nav-button:hover {
  transform: scale(1.2);
}

/* Dias da Semana */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  font-size: 0.85em;
  color: rgba(255, 215, 0, 0.7);
  font-weight: 600;
  padding: 8px 0;
}

/* Grid de Dias */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 20px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border: 1px solid transparent;
}

.day.empty {
  cursor: default;
  background: transparent;
}

.day.current-month {
  background: rgba(255, 255, 255, 0.08);
}

.day.today {
  border: 2px solid #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.day.has-streak {
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.3), rgba(255, 215, 0, 0.2));
  border: 1px solid rgba(255, 215, 0, 0.5);
}

.day.selected {
  border: 2px solid #FFD700;
  transform: scale(1.05);
}

.day:hover:not(.empty) {
  background: rgba(255, 215, 0, 0.2);
  transform: scale(1.05);
}

.day-number {
  font-size: 1em;
  color: #f0e6d2;
  font-weight: 500;
}

.streak-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.7em;
}

/* Informações da Ofensiva */
.streak-info {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
}

.streak-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.2em;
  color: #FFD700;
  font-weight: bold;
}

/* Botão Jogar */
.play-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: white;
  font-size: 1.3em;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.play-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.play-button:active {
  transform: translateY(0);
}

/* Responsividade */
@media (max-width: 768px) {
  .streak-calendar {
    padding: 16px;
    margin: 10px;
  }
  
  .month-year {
    font-size: 1.2em;
  }
  
  .day-number {
    font-size: 0.9em;
  }
}
</style>