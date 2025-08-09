'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, Heading, Text, Box } from '@radix-ui/themes'

interface NormalRange {
  id: string
  marker_type: string
  min_value: number
  max_value: number
  unit: string
}

export default function TestDatabase() {
  const [normalRanges, setNormalRanges] = useState<NormalRange[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [envDebug, setEnvDebug] = useState<any>({})

  useEffect(() => {
    // Debug environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setEnvDebug({
      url: supabaseUrl ? 'Set' : 'Missing',
      urlValue: supabaseUrl?.substring(0, 30) + '...',
      key: supabaseAnonKey ? 'Set' : 'Missing',
      keyValue: supabaseAnonKey?.substring(0, 30) + '...'
    })

    async function testConnection() {
      try {
        if (!supabaseUrl || !supabaseAnonKey) {
          setError('Missing environment variables')
          setLoading(false)
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        
        const { data, error } = await supabase
          .from('normal_ranges')
          .select('*')
          .limit(5)

        if (error) {
          setError(error.message)
        } else {
          setNormalRanges(data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <Box p="6">
      <Heading size="6" mb="4">Database Connection Test</Heading>
      
      {/* Debug Info */}
      <Card mb="4">
        <Text weight="bold">Environment Variables Debug:</Text>
        <Text size="2" as="div">URL: {envDebug.url} ({envDebug.urlValue})</Text>
        <Text size="2" as="div">Key: {envDebug.key} ({envDebug.keyValue})</Text>
      </Card>
      
      {loading ? (
        <Card>
          <Text>Testing connection...</Text>
        </Card>
      ) : error ? (
        <Card>
          <Text color="red">❌ Error: {error}</Text>
          <Text size="2" mt="2">
            Check your .env.local file and restart the dev server
          </Text>
        </Card>
      ) : (
        <Card>
          <Text color="green" weight="bold">✅ Database Connected Successfully!</Text>
          <Text size="2" mt="2">Found {normalRanges.length} Chilean normal ranges:</Text>
          {normalRanges.map((range) => (
            <Text key={range.id} size="2" as="div">
              • {range.marker_type}: {range.min_value}-{range.max_value} {range.unit}
            </Text>
          ))}
        </Card>
      )}
    </Box>
  )
}