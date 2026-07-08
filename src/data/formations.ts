import type { Formation, FormationSlot } from '../entities/tactic/types'

const slot=(id:string,position:FormationSlot['position'],x:number,y:number,defaultRole:FormationSlot['defaultRole']):FormationSlot=>({id,position,x,y,defaultRole})
export const formations:Formation[]=[
  {id:'formation-433',name:'4-3-3',label:'균형적인 측면 전개',slots:[slot('gk','GK',50,92,'sweeper_keeper'),slot('lb','LB',15,73,'wing_back'),slot('lcb','CB',38,79,'ball_playing_defender'),slot('rcb','CB',62,79,'stopper'),slot('rb','RB',85,73,'full_back'),slot('dm','DM',50,61,'anchor'),slot('lcm','CM',35,48,'box_to_box'),slot('rcm','CM',65,48,'advanced_playmaker'),slot('lw','LW',18,25,'inside_forward'),slot('st','ST',50,18,'pressing_forward'),slot('rw','RW',82,25,'winger')]},
  {id:'formation-4231',name:'4-2-3-1',label:'중앙 창의성과 수비 균형',slots:[slot('gk','GK',50,92,'goalkeeper'),slot('lb','LB',15,73,'full_back'),slot('lcb','CB',38,79,'ball_playing_defender'),slot('rcb','CB',62,79,'stopper'),slot('rb','RB',85,73,'full_back'),slot('ldm','DM',38,60,'anchor'),slot('rdm','DM',62,60,'deep_lying_playmaker'),slot('lw','LW',18,36,'inside_forward'),slot('am','AM',50,38,'advanced_playmaker'),slot('rw','RW',82,36,'winger'),slot('st','ST',50,18,'target_forward')]},
  {id:'formation-343',name:'3-4-3',label:'위험을 감수한 공격 숫자 확보',slots:[slot('gk','GK',50,92,'sweeper_keeper'),slot('lcb','CB',28,76,'ball_playing_defender'),slot('cb','CB',50,80,'stopper'),slot('rcb','CB',72,76,'ball_playing_defender'),slot('lwb','LWB',12,55,'wing_back'),slot('lcm','CM',40,56,'box_to_box'),slot('rcm','CM',60,56,'deep_lying_playmaker'),slot('rwb','RWB',88,55,'wing_back'),slot('lw','LW',18,26,'inside_forward'),slot('st','ST',50,18,'target_forward'),slot('rw','RW',82,26,'inside_forward')]},
]

export const getFormation=(id:string)=>formations.find(formation=>formation.id===id)??formations[0]
