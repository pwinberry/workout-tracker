

import { useEffect, useMemo, useState } from 'react';

export default function WorkoutTrackerApp() {

  const starterDays = [
    {
      id: 1,
      name: 'Push Day',
      exercises: [
        {
          id: 101,
          name: 'Bench Press',
          sets: 4,
          reps: '8-10',
          weights: ['', '', '', ''],
          notes: ''
        },
        {
          id: 102,
          name: 'Incline DB Press',
          sets: 3,
          reps: '10-12',
          weights: ['', '', ''],
          notes: ''
        }
      ]
    },
    {
      id: 2,
      name: 'Pull Day',
      exercises: []
    },
    {
      id: 3,
      name: 'Leg Day',
      exercises: []
    }
  ];
  const [workoutDays, setWorkoutDays] = useState(() => {
    const saved = localStorage.getItem('workout-days');
    return saved ? JSON.parse(saved) : starterDays;
  });


  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('workout-history');
    return saved ? JSON.parse(saved) : [];
  });


  const [activeDayId, setActiveDayId] = useState(() => workoutDays[0]?.id || 1);
  const [newDayName, setNewDayName] = useState('');
  const [newExercise, setNewExercise] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => {
    localStorage.setItem('workout-days', JSON.stringify(workoutDays));
  }, [workoutDays]);


  useEffect(() => {
    localStorage.setItem('workout-history', JSON.stringify(history));
  }, [history]);


  const activeDay = useMemo(
    () => workoutDays.find(day => day.id === activeDayId) || workoutDays[0],
    [workoutDays, activeDayId]
  );


  const addWorkoutDay = () => {
    if (!newDayName.trim()) return;
    const newDay = {
      id: Date.now(),
      name: newDayName.trim(),
      exercises: []
    };
    setWorkoutDays([...workoutDays, newDay]);
    setActiveDayId(newDay.id);
    setNewDayName('');
  };


  const updateDayName = (dayId, value) => {
    setWorkoutDays(workoutDays.map(day =>
      day.id === dayId ? { ...day, name: value } : day
    ));
  };


  const deleteWorkoutDay = (dayId) => {
    if (workoutDays.length === 1) return;
    const remaining = workoutDays.filter(day => day.id !== dayId);
    setWorkoutDays(remaining);
    setActiveDayId(remaining[0].id);
  };


  const addExercise = () => {
    if (!newExercise.trim() || !activeDay) return;


    const exercise = {
      id: Date.now(),
      name: newExercise.trim(),
      sets: 3,
      reps: '10',
      weights: ['', '', ''],
      notes: ''
    };


    setWorkoutDays(workoutDays.map(day =>
      day.id === activeDay.id
        ? { ...day, exercises: [...day.exercises, exercise] }
        : day
    ));


    setNewExercise('');
  };

  const updateExercise = (exerciseId, field, value) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id !== activeDay.id) return day;
      return {
        ...day,
        exercises: day.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const updated = { ...ex, [field]: value };
          if (field === 'sets') {
            const count = Math.max(Number(value) || 1, 1);
            updated.sets = count;
            updated.weights = Array.from({ length: count }, (_, i) => ex.weights[i] || '');
          }


          return updated;
        })
      };
    }));
  };

  const updateWeight = (exerciseId, index, value) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id !== activeDay.id) return day;


      return {
        ...day,
        exercises: day.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const weights = [...ex.weights];
          weights[index] = value;
          return { ...ex, weights };
        })
      };
    }));
  };

  const deleteExercise = (exerciseId) => {
    setWorkoutDays(workoutDays.map(day =>
      day.id === activeDay.id
        ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) }
        : day
    ));
  };

  const saveWorkoutToHistory = () => {
    if (!activeDay) return;


    const completedWorkout = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      dayName: activeDay.name,
      exercises: activeDay.exercises.map(ex => ({ ...ex }))
    };


    setHistory([completedWorkout, ...history]);
  };


  const exportCSV = () => {
    const rows = [
      ['Date', 'Workout Day', 'Exercise', 'Planned Sets', 'Planned Reps', 'Set Number', 'Weight', 'Notes']
    ];


    history.forEach(entry => {
      entry.exercises.forEach(ex => {
        ex.weights.forEach((weight, idx) => {
          rows.push([
            entry.date,
            entry.dayName,
            ex.name,
            ex.sets,
            ex.reps,
            idx + 1,
            weight,
            ex.notes || ''
          ]);
        });
      });
    });


    activeDay?.exercises.forEach(ex => {
      ex.weights.forEach((weight, idx) => {
        rows.push([
          'Current Week',
          activeDay.name,
          ex.name,
          ex.sets,
          ex.reps,
          idx + 1,
          weight,
          ex.notes || ''
        ]);
      });
    });


    const csv = rows.map(row =>
  row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')
).join('\n');


    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workout-tracker-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };


  const getLastTimeWeights = (exerciseName) => {
    const lastMatch = history.find(workout =>
      workout.exercises.some(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())
    );


    if (!lastMatch) return 'No history';


    const exercise = lastMatch.exercises.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );


    return exercise?.weights?.filter(Boolean).join(' / ') || 'No weights logged';
  };


  const clearHistory = () => {
    setHistory([]);
  };


  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-3xl bg-slate-900 p-5 text-white shadow-lg sm:p-6">
          <p className="text-sm uppercase tracking-wide text-slate-300">Gym Log</p>
          <h1 className="text-2xl font-bold sm:text-4xl">Weekly Workout Tracker</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Build workout days, plan sets and reps, log actual weights, save completed workouts, and export everything to CSV.
          </p>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex gap-2 rounded-2xl bg-white p-2 shadow">
            <input
              className="min-w-0 flex-1 rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add workout day, ex: Upper Body"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
            />
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={addWorkoutDay}
            >
              Add Day
            </button>
          </div>


          <button
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow"
            onClick={saveWorkoutToHistory}
          >
            Save Workout
          </button>


          <button
            className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {workoutDays.map(day => (
            <button
              key={day.id}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                activeDay?.id === day.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700'
              }`}
              onClick={() => setActiveDayId(day.id)}
            >
              {day.name}
            </button>
          ))}
        </div>


        {activeDay && (
          <div className="mb-5 rounded-3xl bg-white p-4 shadow sm:p-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-xl border p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={activeDay.name}
                onChange={(e) => updateDayName(activeDay.id, e.target.value)}
              />
              <button
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={workoutDays.length === 1}
                onClick={() => deleteWorkoutDay(activeDay.id)}
              >
                Delete Day
              </button>
            </div>


            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add exercise, ex: Squat"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
              />
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={addExercise}
              >
                Add
              </button>
            </div>
          </div>
        )}


        <div className="space-y-4">
          {activeDay?.exercises.length === 0 && (
            <div className="rounded-3xl bg-white p-6 text-center text-slate-500 shadow">
              No exercises yet. Add your first exercise above.
            </div>
          )}
          {activeDay?.exercises.map(exercise => (
            <div key={exercise.id} className="rounded-3xl bg-white p-4 shadow sm:p-5">
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
                <label className="text-sm font-semibold text-slate-600">
                  Exercise
                  <input
                    className="mt-1 w-full rounded-xl border p-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Sets
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Reps This Week
                  <input
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                    placeholder="8-10"
                  />
                </label>


                <button
                  className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white lg:mt-6"
                  onClick={() => deleteExercise(exercise.id)}
                >
                  Delete
                </button>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 font-semibold text-slate-800">Weight Logged by Set</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {exercise.weights.map((weight, idx) => (
                    <label key={idx} className="text-xs font-semibold text-slate-500">
                      Set {idx + 1}
                      <input
                        className="mt-1 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="lbs"
                        value={weight}
                        onChange={(e) => updateWeight(exercise.id, idx, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>


              <label className="text-sm font-semibold text-slate-600">
                Notes
                <textarea
                  className="mt-1 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Form notes, difficulty, pain, machine setting, etc."
                  value={exercise.notes}
                  onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                />
              </label>
            </div>
          ))}
        </div>


        <div className="mt-6 rounded-3xl bg-white p-4 shadow sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Exercise History</h2>
              <p className="text-sm text-slate-500">Saved workouts appear here after you click Save Workout.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
              <button
                className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
                onClick={clearHistory}
              >
                Clear
              </button>
            </div>
          </div>


          {showHistory && (
            <div className="space-y-3">
              {history.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No saved workouts yet.
                </div>
              )}


              {history.map(entry => (
                <div key={entry.id} className="rounded-2xl border p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-bold">{entry.dayName}</h3>
                    <span className="text-sm text-slate-500">{entry.date}</span>
                  </div>


                  <div className="space-y-2">
                    {entry.exercises.map(ex => (
                      <div key={ex.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="font-semibold text-slate-800">{ex.name}</div>
                        <div className="text-slate-600">
                          Plan: {ex.sets} sets x {ex.reps} reps
                        </div>
                        <div className="mt-1 text-slate-600">
                          Weights: {ex.weights.map((w, i) => `Set ${i + 1}: ${w || '-'} lbs`).join(' | ')}
                        </div>
                        {ex.notes && <div className="mt-1 text-slate-500">Notes: {ex.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}