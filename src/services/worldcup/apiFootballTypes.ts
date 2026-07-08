export interface ApiFootballEnvelope<T> {
  response?: T
  errors?: unknown
  message?: string
  paging?: { current?: number; total?: number }
}

export interface ApiFootballFixture {
  fixture?: {
    id?: number
    date?: string
    timezone?: string
    status?: { long?: string; short?: string; elapsed?: number | null }
    venue?: { id?: number | null; name?: string | null; city?: string | null }
  }
  league?: { id?: number; name?: string; season?: number; round?: string }
  teams?: {
    home?: { id?: number; name?: string; code?: string | null; winner?: boolean | null; logo?: string }
    away?: { id?: number; name?: string; code?: string | null; winner?: boolean | null; logo?: string }
  }
  goals?: { home?: number | null; away?: number | null }
  score?: {
    halftime?: { home?: number | null; away?: number | null } | null
    fulltime?: { home?: number | null; away?: number | null } | null
    extratime?: { home?: number | null; away?: number | null } | null
    penalty?: { home?: number | null; away?: number | null } | null
  }
}

export interface ApiFootballTeamResponse {
  team?: { id?: number; name?: string; code?: string | null; country?: string | null; national?: boolean; logo?: string }
}

export interface ApiFootballStandingResponse {
  league?: {
    standings?: Array<Array<{
      rank?: number
      team?: { id?: number; name?: string; code?: string | null; logo?: string }
      points?: number
      goalsDiff?: number
      group?: string
      form?: string | null
      status?: string | null
      description?: string | null
      all?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } }
    }>>
  }
}

export interface ApiFootballFixtureEvent {
  time?: { elapsed?: number; extra?: number | null }
  team?: { id?: number; name?: string; logo?: string }
  player?: { id?: number | null; name?: string | null }
  assist?: { id?: number | null; name?: string | null }
  type?: string
  detail?: string | null
  comments?: string | null
}

export interface ApiFootballFixtureLineup {
  team?: { id?: number; name?: string; logo?: string }
  formation?: string | null
  startXI?: Array<{ player?: { id?: number; name?: string; number?: number | null; pos?: string | null; grid?: string | null } }>
  substitutes?: Array<{ player?: { id?: number; name?: string; number?: number | null; pos?: string | null; grid?: string | null } }>
}

export interface ApiFootballFixtureStatistic {
  team?: { id?: number; name?: string; logo?: string }
  statistics?: Array<{ type?: string; value?: string | number | null }>
}

export interface ApiFootballFixturePlayerStats {
  team?: { id?: number; name?: string; logo?: string }
  players?: Array<{
    player?: { id?: number; name?: string; photo?: string }
    statistics?: Array<{
      games?: { number?: number | null; pos?: string | null; rating?: string | number | null; minutes?: number | null }
      shots?: { total?: number | null; on?: number | null }
      goals?: { total?: number | null; assists?: number | null }
      passes?: { total?: number | null; key?: number | null }
      tackles?: { total?: number | null }
      dribbles?: { attempts?: number | null; success?: number | null }
      duels?: { total?: number | null; won?: number | null }
      cards?: { yellow?: number | null; red?: number | null }
    }>
  }>
}
