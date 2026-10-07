export interface VoteRow {
    user_id: string
    generation_id: string
    vote_type: 'up' | 'down'
  }
  
  export interface GenerationRow {
    id: string
    user_id: string
    image_url: string
    caption: string
    created_at: string
  }
  
  export type Reason = 'similar' | 'trending' | 'fresh'
  export type RankedGeneration = GenerationRow & { score: number; reason: Reason }
  
  type Counts = Map<string, { up: number; down: number }>
  
  function countVotes(votes: VoteRow[]): Counts {
    const counts: Counts = new Map()
    for (const v of votes) {
      const c = counts.get(v.generation_id) ?? { up: 0, down: 0 }
      if (v.vote_type === 'up') c.up++
      else c.down++
      counts.set(v.generation_id, c)
    }
    return counts
  }
  
  /** Wilson lower bound (95%): how good something is, without over-rewarding 1-2 votes. */
  export function wilsonScore(up: number, down: number): number {
    const n = up + down
    if (n === 0) return 0
    const z = 1.96
    const p = up / n
    const denom = 1 + (z * z) / n
    const centre = p + (z * z) / (2 * n)
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
    return Math.max(0, (centre - margin) / denom)
  }
  
  type Ratings = Map<string, Map<string, number>> // user -> (generation -> +1 / -1)
  
  function buildRatings(votes: VoteRow[]): Ratings {
    const ratings: Ratings = new Map()
    for (const v of votes) {
      const row = ratings.get(v.user_id) ?? new Map<string, number>()
      row.set(v.generation_id, v.vote_type === 'up' ? 1 : -1)
      ratings.set(v.user_id, row)
    }
    return ratings
  }
  
  /** Cosine similarity between two users' vote vectors, shrunk when they overlap on
   *  only a few captions (so one shared vote doesn't make two users "soulmates"). */
  function similarity(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0
    let overlap = 0
    for (const [id, ra] of a) {
      const rb = b.get(id)
      if (rb !== undefined) {
        dot += ra * rb
        overlap++
      }
    }
    if (overlap === 0) return 0
    // every entry is +1 or -1, so a vector's length is sqrt(number of entries)
    const cos = dot / (Math.sqrt(a.size) * Math.sqrt(b.size))
    return (cos * Math.min(overlap, 5)) / 5
  }
  
  const FRESH_SCORE = 0.15 // gives brand-new captions a little exposure
  
  export function rankForUser(
    userId: string | null,
    generations: GenerationRow[],
    votes: VoteRow[]
  ): RankedGeneration[] {
    const counts = countVotes(votes)
    const ratings = buildRatings(votes)
    const mine = userId ? ratings.get(userId) : undefined
  
    // Neighbours = other users with positively correlated taste (needs 3+ votes from me)
    const neighbours: { theirs: Map<string, number>; sim: number }[] = []
    if (userId && mine && mine.size >= 3) {
      for (const [otherId, theirs] of ratings) {
        if (otherId === userId) continue
        const sim = similarity(mine, theirs)
        if (sim > 0) neighbours.push({ theirs, sim })
      }
    }
  
    const ranked = generations.map((g): RankedGeneration => {
      const c = counts.get(g.id)
      const popularity = c ? wilsonScore(c.up, c.down) : FRESH_SCORE
      const fallbackReason: Reason = c ? 'trending' : 'fresh'
  
      let num = 0
      let den = 0
      for (const n of neighbours) {
        const r = n.theirs.get(g.id)
        if (r !== undefined) {
          num += n.sim * r
          den += n.sim
        }
      }
  
      if (den > 0) {
        const cf = num / den // -1 … +1: how much similar users liked it
        const score = 0.6 * ((cf + 1) / 2) + 0.4 * popularity
        return { ...g, score, reason: cf > 0.3 ? 'similar' : fallbackReason }
      }
      return { ...g, score: popularity, reason: fallbackReason }
    })
  
    return ranked.sort((a, b) => b.score - a.score)
  }
  
  /** Top captions by community rating (used on the landing page). */
  export function topRated<T extends { id: string }>(
    generations: T[],
    votes: VoteRow[],
    n = 3
  ): T[] {
    const counts = countVotes(votes)
    return generations
      .map((g) => {
        const c = counts.get(g.id)
        return { g, up: c?.up ?? 0, score: c ? wilsonScore(c.up, c.down) : 0 }
      })
      .filter((x) => x.up > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((x) => x.g)
  }
  
  /** Captions the community loved / hated, used as examples in the Gemini prompt. */
  export function preferenceExamples(
    generations: { id: string; caption: string }[],
    votes: VoteRow[],
    topN = 5,
    bottomN = 3
  ) {
    const counts = countVotes(votes)
    const scored = generations
      .map((g) => {
        const c = counts.get(g.id) ?? { up: 0, down: 0 }
        return { caption: g.caption, ...c, score: wilsonScore(c.up, c.down) }
      })
      .filter((g) => g.up + g.down > 0)
  
    const liked = scored
      .filter((g) => g.up > g.down)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((g) => g.caption)
  
    const disliked = scored
      .filter((g) => g.down > g.up)
      .sort((a, b) => b.down - b.up - (a.down - a.up))
      .slice(0, bottomN)
      .map((g) => g.caption)
  
    return { liked, disliked }
  }