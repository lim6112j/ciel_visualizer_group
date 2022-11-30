# planner 
* build react app
      yarn run build
      move files in build to /dist/planning/
      edit dist/planning/index.html : / -> dist/planning
# moblle simulator
* environment
  * node v18.7.0
  * npm 8.15.0
  * parcel 2.7.0
* run

	yarn run server
* build
	npx parcel index.html --public-url ./dist
* run as daemon

      npm i -g pm2
      pm2 start npm -- start

* data format (extraInfo는 당장 필요 없음 추후 정의 )

``` json
{ 
    "vehicle" :
    [
        "mod1" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952863, "station": "station1", "action": "pickUp", "target": ["cstm1, cstm2"]},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028955200, "station": "station2", "action": "dropOff", "target": ["cstm1"] },
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028955200, "station": "station2", "action": "dispatch", "target": ["cstm4"] },
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028959863, "station": "station3", "action": "dropOff", "target": ["cstm2"] },
        ],
        "mod2" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952863, "station": "station1","action": "pickUp"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028955200, "station": "station2","action": "dropOff"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028959863, "station": ""},
        ],
        "mod3" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952863, "station": "station1","action": "pickUp"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028955200, "station": "station2","action": "dropOff"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028959863, "station": ""},
        ],
    ],
    "customers" : 
    [
        "cstm1" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952163, "action": "request", "target": ""},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952263, "action": "dispatch", "target": "mod3", "station": "station3", "eta": 10},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952363, "action": "getOn", "target": "mod3"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952263, "action": "reroute", "target": "mod3", "station": "", "eta": 13},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952563, "action": "getOff", "target": "mod3"},
        ],
        "cstm2" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952163, "action": "request"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952363, "action": "getOn", "target": "mod1"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952563, "action": "getOff", "target": "mod1"},
        ],
        "cstm3" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952163, "action": "request", "target": ""},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952363, "action": "getOn", "target": "mod2"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952563, "action": "getOff", "target": "mod2"},
        ],
        "cstm4" : [
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952163, "action": "request", "target": ""},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952363, "action": "getOn", "target": "mod2"},
            {"lat": 37.411540498926584, "lng": 126.97137140743712 "timestamp": 1660028952563, "action": "getOff", "target": "mod2"},
        ],
    ],
    "summary" : [
        {
            "transportedPerVehicleCapacity": 30,      //실차율
            "numberOfTransported": 12300 ,   //총수송 인원
            "successRateOfDispatch": 90 ,   //배차 성공률 
        }
    ],
    "extraInfo" : 
    [
        "projectName" : "I-MOD phase 1",
        "projectDate" : "20220801",
        "algorithm" : "xxxxxxx",
    ]
}
```
* 데이터 타임스탬프는 시작 시간을 맞추는 사전처리를 해준다. 실제 운행 시간 이전에는 고정 위결도와 시장 타임 스탬프 삽입.
* 주요 지표
  * 대기시간 : (getOn - dispatch) time / number of dispatches
  * 이동시간 : (getOff - getOn) time / number of customers onboard
  * 우회시간 : (getOff - getOn - eta) time / number of customers onboard
  * 실차율 : (탑승 인원 / 정원) - 단위시간당 (시간, 일, 월 등) - batch 처리시 데이터 생성 or input data 기준
  * 총 수송인원 : 단위 시간상 탑승인원 - batch 처리시 데이터 생성 or input data 기준
  * 배차 성공율 : (dispatch - request) / request
  * 배차 대기시간 , 배차 성공률 : 반비례 관계
  * 정차 시간 : 
  * 혼잡도 : (탑승윈원 / 정원) - 단위시간상(input data 당) 숫자로 연산(시간, 일, 월 등)
  
* 참고자료
  * [Reinforcement Learning for solving the Vehicle Routing Problem](https://www.youtube.com/watch?v=SNcZAt_vbkY)
  * [solving TSP with Reinforcement Learning](https://ekimetrics.github.io/blog/2021/11/03/tsp/)
  * [google OR-Tools](https://developers.google.com/optimization/introduction/overview)
