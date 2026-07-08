export interface Team {
  id:string
  source:{provider:'seed'|'statsbomb'|'api-football'|'github-worldcup2026';externalId?:string}
  name:string
  shortName:string
  countryCode:string
  primaryColor:string
  secondaryColor:string
  startingPlayerIds:string[]
  benchPlayerIds:string[]
}
