import type { Player, PlayerAttributes, PlayerPosition, PlayerRole } from '../entities/player/types'

const base:PlayerAttributes={pace:70,finishing:65,passing:70,crossing:65,dribbling:68,pressing:70,defense:65,stamina:75,offBall:68,heightPower:65}
const p=(id:string,name:string,shirtNumber:number,position:PlayerPosition,role:PlayerRole,attributes:Partial<PlayerAttributes>):Player=>({
  id,source:{provider:'seed'},name,shirtNumber,primaryPosition:position,
  positions:[{position,rating:90}],roles:[{role,rating:90}],attributes:{...base,...attributes},
})

export const players:Player[]=[
  p('ta-gk1','김도윤',1,'GK','sweeper_keeper',{defense:84,passing:72,heightPower:80}),
  p('ta-lb','박준호',3,'LB','wing_back',{pace:82,crossing:78,stamina:84,defense:72}),
  p('ta-cb1','이태석',4,'CB','ball_playing_defender',{passing:77,defense:84,heightPower:82,pace:68}),
  p('ta-cb2','최민재',5,'CB','stopper',{defense:86,heightPower:88,passing:64}),
  p('ta-rb','강현우',2,'RB','full_back',{pace:79,crossing:73,defense:76,stamina:82}),
  p('ta-dm','정시우',6,'DM','anchor',{defense:82,passing:76,pressing:80,stamina:83}),
  p('ta-cm1','윤재민',8,'CM','box_to_box',{passing:80,pressing:82,stamina:88,offBall:75}),
  p('ta-cm2','한지훈',10,'AM','advanced_playmaker',{passing:86,dribbling:83,offBall:80,finishing:73}),
  p('ta-lw','서민준',11,'LW','inside_forward',{pace:87,finishing:80,dribbling:85,offBall:84}),
  p('ta-st','조우진',9,'ST','pressing_forward',{finishing:83,pressing:84,offBall:86,heightPower:78}),
  p('ta-rw','임성호',7,'RW','winger',{pace:88,crossing:82,dribbling:84,stamina:79}),
  p('ta-gk2','오세현',21,'GK','goalkeeper',{defense:78,heightPower:76}),
  p('ta-bcb','백승민',15,'CB','stopper',{defense:79,heightPower:84,pace:65}),
  p('ta-bcm','남도현',16,'CM','deep_lying_playmaker',{passing:82,defense:70,stamina:76}),
  p('ta-bw','류건우',18,'LW','winger',{pace:84,crossing:77,dribbling:80}),
  p('ta-bst','문하준',19,'ST','target_forward',{finishing:79,offBall:77,heightPower:90,pace:62}),
  p('tb-gk1','마르코 실바',1,'GK','goalkeeper',{defense:85,heightPower:84}),
  p('tb-lb','루이스 코스타',5,'LB','full_back',{pace:77,defense:80,crossing:72}),
  p('tb-cb1','다니엘 로차',3,'CB','ball_playing_defender',{defense:85,passing:79,heightPower:83}),
  p('tb-cb2','브루노 알베스',4,'CB','stopper',{defense:88,heightPower:89,pace:64}),
  p('tb-rb','티아고 누네스',2,'RB','wing_back',{pace:84,crossing:80,stamina:85,defense:73}),
  p('tb-dm','안드레 모라',6,'DM','anchor',{defense:84,pressing:83,passing:74}),
  p('tb-cm1','미겔 산투스',8,'CM','deep_lying_playmaker',{passing:86,stamina:82,defense:72}),
  p('tb-am','파울루 리마',10,'AM','advanced_playmaker',{passing:88,dribbling:86,offBall:82}),
  p('tb-lw','디오구 페레스',7,'LW','inside_forward',{pace:89,finishing:84,dribbling:87,offBall:86}),
  p('tb-st','라파엘 마틴스',9,'ST','target_forward',{finishing:85,heightPower:91,offBall:83}),
  p('tb-rw','주앙 페레이라',11,'RW','winger',{pace:86,crossing:84,dribbling:83}),
  p('tb-gk2','토마스 헤이스',22,'GK','sweeper_keeper',{defense:79,passing:75,heightPower:78}),
  p('tb-bcb','카를루스 벨로',14,'CB','stopper',{defense:81,heightPower:86}),
  p('tb-bcm','루벤 비에이라',16,'CM','box_to_box',{passing:78,pressing:80,stamina:87}),
  p('tb-bw','페드루 고메스',17,'RW','inside_forward',{pace:85,finishing:78,dribbling:82}),
  p('tb-bst','누누 카르도주',19,'ST','poacher',{finishing:82,offBall:87,pace:75}),
]

export const playerById=new Map(players.map(player=>[player.id,player]))
