import { useState } from 'react'
import type { PlaceCategory } from '../types/places'
import { usePlaces } from '../hooks/usePlaces'
import { FoodMap, MapLegend } from '../components/food/FoodMap'
import { AddPlaceForm } from '../components/food/AddPlaceForm'
import { PlacePicker } from '../components/food/PlacePicker'
import { PlaceList } from '../components/food/PlaceList'

export default function FoodPicker() {
  const { places, loading, apiAvailable, addPlace, markVisited, removePlace, addFromOsm, pickOne } =
    usePlaces()

  const [picked, setPicked] = useState<ReturnType<typeof pickOne>>(null)
  const [shaking, setShaking] = useState(false)
  const [filterCategory, setFilterCategory] = useState<PlaceCategory | 'all'>('all')

  // Add-place form state
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formCategory, setFormCategory] = useState<PlaceCategory>('food')
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleAddPlace = async () => {
    if (!formName.trim()) return
    setSubmitting(true)
    await addPlace({ name: formName, address: formAddress, category: formCategory }, setGeocoding)
    setFormName('')
    setFormAddress('')
    setFormCategory('food')
    setShowForm(false)
    setSubmitting(false)
  }

  const handlePickOne = () => {
    const result = pickOne(filterCategory)
    if (!result) return
    setPicked(result)
    setShaking(true)
    setTimeout(() => setShaking(false), 600)
  }

  const filteredPlaces = places.filter(
    (p) => filterCategory === 'all' || p.category === filterCategory
  )

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">Food Picker</h1>
        {!apiAvailable && (
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Offline mode — run <code className="font-mono">just pages</code> for full sync
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Track places you&apos;ve been and let the app pick where to go next.
      </p>

      <FoodMap
        places={places}
        loading={loading}
        onMarkVisited={markVisited}
        onRemove={async (id) => {
          await removePlace(id)
          if (picked?.id === id) setPicked(null)
        }}
        onAddFromOsm={addFromOsm}
      />

      <MapLegend />

      <PlacePicker
        filterCategory={filterCategory}
        filteredCount={filteredPlaces.length}
        picked={picked}
        shaking={shaking}
        onFilterChange={setFilterCategory}
        onPick={handlePickOne}
        onMarkVisited={markVisited}
        onDismiss={() => setPicked(null)}
      />

      <PlaceList
        places={filteredPlaces}
        totalCount={filteredPlaces.length}
        onMarkVisited={markVisited}
        onRemove={async (id) => {
          await removePlace(id)
          if (picked?.id === id) setPicked(null)
        }}
        onAddClick={() => setShowForm((v) => !v)}
        showForm={showForm}
      >
        {showForm && (
          <AddPlaceForm
            formName={formName}
            formAddress={formAddress}
            formCategory={formCategory}
            geocoding={geocoding}
            submitting={submitting}
            onNameChange={setFormName}
            onAddressChange={setFormAddress}
            onCategoryChange={setFormCategory}
            onSubmit={handleAddPlace}
            onCancel={() => setShowForm(false)}
          />
        )}
      </PlaceList>
    </div>
  )
}
