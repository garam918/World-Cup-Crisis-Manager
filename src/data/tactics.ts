import type { EditablePlayerRole, Tactic, TacticalInstruction, TacticalInstructions } from '../entities/tactic/types'
import type { PlayerPosition } from '../entities/player/types'

export const tacticalInstructions:TacticalInstruction[]=[
  {key:'defensiveLine',label:'수비 라인',description:'최종 수비선의 평균 위치',options:[{value:'low',label:'낮게'},{value:'medium',label:'중간'},{value:'high',label:'높게'}]},
  {key:'pressingIntensity',label:'압박 강도',description:'상대 빌드업을 방해하는 빈도',options:[{value:'low',label:'낮게'},{value:'medium',label:'중간'},{value:'high',label:'높게'}]},
  {key:'tempo',label:'공격 템포',description:'공을 전진시키는 속도',options:[{value:'slow',label:'느리게'},{value:'balanced',label:'균형'},{value:'fast',label:'빠르게'}]},
  {key:'attackDirection',label:'공격 방향',description:'공격 전개의 우선 경로',options:[{value:'left',label:'왼쪽'},{value:'center',label:'중앙'},{value:'right',label:'오른쪽'},{value:'balanced',label:'균형'}]},
  {key:'riskLevel',label:'위험 감수',description:'공격 숫자와 전진 패스 빈도',options:[{value:'safe',label:'안전'},{value:'balanced',label:'균형'},{value:'aggressive',label:'공격적'}]},
  {key:'width',label:'공격 폭',description:'공격 시 좌우 폭과 하프스페이스 활용',options:[{value:'narrow',label:'좁게'},{value:'balanced',label:'균형'},{value:'wide',label:'넓게'}]},
  {key:'buildUpStyle',label:'빌드업 방식',description:'후방 전개와 전진 패스의 성향',options:[{value:'direct',label:'직선적'},{value:'balanced',label:'균형'},{value:'possession',label:'점유'}]},
  {key:'chanceCreation',label:'찬스 생성',description:'박스 진입을 만드는 주된 방식',options:[{value:'crosses',label:'크로스'},{value:'balanced',label:'균형'},{value:'through_balls',label:'침투 패스'}]},
  {key:'defensiveApproach',label:'수비 방식',description:'수비 시 마킹과 공간 관리 방식',options:[{value:'zonal',label:'지역'},{value:'balanced',label:'균형'},{value:'man_marking',label:'대인'}]},
]

export const defaultInstructions:TacticalInstructions={defensiveLine:'medium',pressingIntensity:'medium',tempo:'balanced',attackDirection:'balanced',riskLevel:'balanced',width:'balanced',buildUpStyle:'balanced',chanceCreation:'balanced',defensiveApproach:'balanced'}
export const defaultTactic:Tactic={formationId:'formation-433',instructions:defaultInstructions,playerRoles:{}}

export const playerRoleOptions:Record<'ST'|'WG'|'CM'|'FB'|'CB'|'GK',{value:EditablePlayerRole;label:string}[]>={
  ST:[{value:'advanced_forward',label:'침투형 공격수'},{value:'link_forward',label:'연계형 공격수'},{value:'pressing_forward',label:'압박형 공격수'}],
  WG:[{value:'wide_dribbler',label:'측면 돌파'},{value:'inside_runner',label:'안쪽 침투'},{value:'defensive_winger',label:'수비 가담'}],
  CM:[{value:'attacking_midfielder',label:'전진형'},{value:'balanced_midfielder',label:'균형형'},{value:'holding_midfielder',label:'수비형'}],
  FB:[{value:'attacking_fullback',label:'공격형'},{value:'balanced_fullback',label:'균형형'},{value:'defensive_fullback',label:'수비형'}],
  CB:[{value:'cover_defender',label:'커버형'},{value:'fighter_defender',label:'파이터형'}],
  GK:[{value:'sweeper_keeper',label:'스위퍼 키퍼'},{value:'standard_keeper',label:'기본형'}],
}

export const roleGroupForPosition=(position:PlayerPosition):keyof typeof playerRoleOptions=>position==='GK'?'GK':position==='CB'?'CB':['LB','RB','LWB','RWB'].includes(position)?'FB':['LW','RW'].includes(position)?'WG':position==='ST'?'ST':'CM'
