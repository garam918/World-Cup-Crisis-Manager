import { WORLD_CUP_2026_QUERY, type RawWorldCupData, type WorldCupDataProvider } from './WorldCupDataProvider'
import { mapApiFootballToSnapshot } from './worldCupDataMapper'

interface ApiFootballConfig { apiKey:string;baseUrl?:string;eventFixtureLimit?:number }
interface ApiEnvelope { response?:unknown[];paging?:{current:number;total:number};errors?:unknown;message?:string }

export class ApiFootballProvider implements WorldCupDataProvider {
  readonly name='api-football'
  private readonly apiKey:string
  private readonly baseUrl:string
  private readonly eventFixtureLimit:number
  constructor(config:ApiFootballConfig){if(!config.apiKey)throw new Error('API_FOOTBALL_KEY is required');this.apiKey=config.apiKey;this.baseUrl=(config.baseUrl??'https://v3.football.api-sports.io').replace(/\/$/,'');this.eventFixtureLimit=config.eventFixtureLimit??20}

  async getWorldCup2026(){return mapApiFootballToSnapshot(await this.fetchWorldCup2026())}
  async fetchWorldCup2026():Promise<RawWorldCupData>{const query=`league=${WORLD_CUP_2026_QUERY.league}&season=${WORLD_CUP_2026_QUERY.season}`;const [fixtures,teams,standings,players]=await Promise.all([this.request(`/fixtures?${query}`),this.request(`/teams?${query}`),this.request(`/standings?${query}`),this.fetchPlayers(query)]);const matches=await this.enrichFixtureEvents(fixtures);return {provider:'api-football',...WORLD_CUP_2026_QUERY,fetchedAt:new Date().toISOString(),matches,teams,standings,players}}

  private async fetchPlayers(query:string){const first=await this.requestEnvelope(`/players?${query}&page=1`),records=[...(first.response??[])];const total=Math.min(first.paging?.total??1,100);for(let page=2;page<=total;page++){const next=await this.request(`/players?${query}&page=${page}`);records.push(...next)}return records}
  private async enrichFixtureEvents(fixtures:unknown[]){const eligible=fixtures.filter(item=>{const status=(item as any)?.fixture?.status?.short;return ['FT','AET','PEN','1H','HT','2H','ET','BT','P'].includes(status)}).slice(-this.eventFixtureLimit),eventMap=new Map<number,unknown[]>();for(const item of eligible){const id=(item as any)?.fixture?.id;if(id)eventMap.set(id,await this.request(`/fixtures/events?fixture=${id}`))}return fixtures.map(item=>{const id=(item as any)?.fixture?.id;return eventMap.has(id)?{...(item as object),events:eventMap.get(id)}:item})}
  private async request(path:string){const payload=await this.requestEnvelope(path);return payload.response??[]}
  private async requestEnvelope(path:string):Promise<ApiEnvelope>{const response=await fetch(`${this.baseUrl}${path}`,{headers:{'x-apisports-key':this.apiKey}});const payload=await response.json() as ApiEnvelope;if(!response.ok||payload.errors&&(Array.isArray(payload.errors)?payload.errors.length:Object.keys(payload.errors as object).length))throw new Error(`API-Football request failed (${response.status}) for ${path}: ${JSON.stringify(payload.errors??payload.message??'unknown error')}`);return payload}
}
