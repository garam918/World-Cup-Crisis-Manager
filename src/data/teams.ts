import type { Team } from '../entities/team/types'

export const teams:Team[]=[
  {id:'team-aurora',source:{provider:'seed'},name:'오로라 FC',shortName:'AUR',countryCode:'KR',primaryColor:'#22c55e',secondaryColor:'#020617',startingPlayerIds:['ta-gk1','ta-lb','ta-cb1','ta-cb2','ta-rb','ta-dm','ta-cm1','ta-cm2','ta-lw','ta-st','ta-rw'],benchPlayerIds:['ta-gk2','ta-bcb','ta-bcm','ta-bw','ta-bst']},
  {id:'team-atlas',source:{provider:'seed'},name:'아틀라스 유나이티드',shortName:'ATL',countryCode:'PT',primaryColor:'#e4e4e7',secondaryColor:'#18181b',startingPlayerIds:['tb-gk1','tb-lb','tb-cb1','tb-cb2','tb-rb','tb-dm','tb-cm1','tb-am','tb-lw','tb-st','tb-rw'],benchPlayerIds:['tb-gk2','tb-bcb','tb-bcm','tb-bw','tb-bst']},
]

export const getTeam=(id:string)=>teams.find(team=>team.id===id)??teams[0]
