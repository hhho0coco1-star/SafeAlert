INSERT INTO region_codes (code, name, parent_code) VALUES
('11', '서울특별시', NULL),
('26', '부산광역시', NULL),
('27', '대구광역시', NULL),
('28', '인천광역시', NULL),
('29', '광주광역시', NULL),
('30', '대전광역시', NULL),
('31', '울산광역시', NULL),
('36', '세종특별자치시', NULL),
('41', '경기도', NULL),
('42', '강원특별자치도', NULL),
('43', '충청북도', NULL),
('44', '충청남도', NULL),
('45', '전북특별자치도', NULL),
('46', '전라남도', NULL),
('47', '경상북도', NULL),
('48', '경상남도', NULL),
('50', '제주특별자치도', NULL)
ON CONFLICT (code) DO NOTHING;