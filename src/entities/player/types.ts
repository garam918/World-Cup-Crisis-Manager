export type PlayerPosition = 'GK'|'LB'|'CB'|'RB'|'LWB'|'RWB'|'DM'|'CM'|'AM'|'LW'|'RW'|'ST'

export type PlayerRole =
  | 'goalkeeper' | 'sweeper_keeper' | 'ball_playing_defender' | 'stopper'
  | 'full_back' | 'wing_back' | 'anchor' | 'deep_lying_playmaker'
  | 'box_to_box' | 'advanced_playmaker' | 'winger' | 'inside_forward'
  | 'pressing_forward' | 'target_forward' | 'poacher'

export interface PlayerAttributes {
  pace:number; finishing:number; passing:number; crossing:number; dribbling:number
  pressing:number; defense:number; stamina:number; offBall:number; heightPower:number
}

export interface RoleSuitability { role:PlayerRole; rating:number }
export interface PositionSuitability { position:PlayerPosition; rating:number }

export interface Player {
  id:string
  source:{provider:'seed'|'statsbomb'|'api-football'|'kaggle';externalId?:string}
  name:string
  shirtNumber:number
  primaryPosition:PlayerPosition
  positions:PositionSuitability[]
  roles:RoleSuitability[]
  attributes:PlayerAttributes
}
