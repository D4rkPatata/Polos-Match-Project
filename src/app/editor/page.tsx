import EditorClient from './EditorClient'

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h2 className="text-xl font-semibold mb-6">Editor de sublimación</h2>
      <EditorClient />
    </main>
  )
}
