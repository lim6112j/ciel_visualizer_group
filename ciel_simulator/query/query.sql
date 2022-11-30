-- demand list 2022-5-30
SELECT t.* FROM mobble_dispatcher.demand t WHERE to_char(success_date, 'YYYY-MM-DD') like '2022-05-30' ORDER BY request_date

-- waypoint path, log combined
SELECT * FROM mobble_log.supply_waypoint_path_log_202205 t INNER JOIN mobble_log.supply_waypoint_log_202205 s on t.get_date = s.get_date WHERE to_char(d.success_date, 'YYYY-MM-DD') LIKE '2022-05-30'

-- waypoint-path, waypoint-log join at 2022-5-30 --- no result
SELECT * FROM mobble_dispatcher.demand d INNER JOIN mobble_log.supply_waypoint_path_log_202205 t on d.success_date=t.get_date INNER JOIN mobble_log.supply_waypoint_log_202205 s on t.get_date = s.get_date WHERE to_char(d.success_date, 'YYYY-MM-DD') LIKE '2022-05-30'

SELECT t.* FROM mobble_dispatcher.demand t WHERE supply_idx=8 and to_char(picked_date, 'YYYY-MM-DD') like '2022-05-27'

SELECT * FROM mobble_log.supply_waypoint_path_log_202205 t INNER JOIN mobble_log.supply_waypoint_log_202205 s on t.pick_up_demand_id_list = s.pick_up_demand_id_list or t.drop_off_demand_id_list = s.drop_off_demand_id_list WHERE to_char(t.get_date, 'YYYY-MM-DD') LIKE '2022-05-27';

-- staging server, working
SELECT * FROM mobble_dispatcher.demand d INNER JOIN mobble_log.supply_waypoint_path_log_202205 t on substring(d.demand_id,1,10) = substring(CAST(t.drop_off_demand_id_list AS Text) , 2, 10) or substring(CAST(d.demand_id as Text),2, 10) = substring(CAST(t.pick_up_demand_id_list as Text),2,10) INNER JOIN mobble_log.supply_waypoint_log_202205 s on substring(CAST(t.pick_up_demand_id_list as Text),2,10) = substring(CAST(s.pick_up_demand_id_list as Text),2,10) or substring(CAST(t.drop_off_demand_id_list as Text),2,10) = substring(CAST(s.drop_off_demand_id_list as Text),2,10) WHERE to_char(d.picked_date, 'YYYY-MM-DD') LIKE '2022-05-27';

SELECT substring(CAST(t.drop_off_demand_id_list AS Text) , 2, 10) FROM mobble_log.supply_waypoint_path_log_202205 t WHERE to_char(t.get_date, 'YYYY-MM-DD') LIKE '2022-05-27';

SELECT substring(demand_id,1,10) FROM mobble_dispatcher.demand d WHERE to_char(d.picked_date, 'YYYY-MM-DD') LIKE '2022-05-27';

--demand where paste
 supply_idx=8 and to_char(picked_date, 'YYYY-MM-DD') like '2022-05-23'

SELECT * FROM mobble_dispatcher.demand d INNER JOIN mobble_log.supply_waypoint_path_log_202206 p on substring(d.demand_id,1,10) = substring(CAST(p.drop_off_demand_id_list AS Text) , 2, 10) or substring(CAST(d.demand_id as Text),2, 10) = substring(CAST(p.pick_up_demand_id_list as Text),2,10) INNER JOIN mobble_log.supply_waypoint_log_202206 l on substring(CAST(p.pick_up_demand_id_list as Text),2,10) = substring(CAST(l.pick_up_demand_id_list as Text),2,10) or substring(CAST(p.drop_off_demand_id_list as Text),2,10) = substring(CAST(l.drop_off_demand_id_list as Text),2,10) WHERE to_char(d.request_date, 'YYYY-MM-DD') LIKE '2022-06-23' ORDER BY l.get_date, l.waypoint_seq;
-- simulation data
SELECT * FROM  mobble_log.supply_waypoint_path_log_202206 p  INNER JOIN mobble_log.supply_waypoint_log_202206 l on substring(CAST(p.pick_up_demand_id_list as Text),2,10) = substring(CAST(l.pick_up_demand_id_list as Text),2,10) or substring(CAST(p.drop_off_demand_id_list as Text),2,10) = substring(CAST(l.drop_off_demand_id_list as Text),2,10) WHERE to_char(l.get_date, 'YYYY-MM-DD') LIKE '2022-06-23' ORDER BY l.get_date, l.waypoint_seq;
SELECT * FROM  mobble_log.supply_waypoint_path_log_202206 p  INNER JOIN mobble_log.supply_waypoint_log_202206 l on substring(CAST(p.pick_up_demand_id_list as Text),2,10) = substring(CAST(l.pick_up_demand_id_list as Text),2,10) or substring(CAST(p.drop_off_demand_id_list as Text),2,10) = substring(CAST(l.drop_off_demand_id_list as Text),2,10) WHERE to_char(l.get_date, 'YYYY-MM-DD') LIKE '2022-06-23' ORDER BY l.get_date, l.waypoint_seq;
