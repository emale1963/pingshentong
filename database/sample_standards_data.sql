-- 规范资料库示例数据

-- 建筑专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('architecture', 'GB 50016-2014', '建筑设计防火规范', '防火规范', '2014版', '2014-08-27', '2015-05-01', 'current', '本规范适用于新建、扩建和改建的建筑设计，对建筑的防火分区、疏散通道、消防设施等作出规定。', '防火、疏散、安全出口、防火分区、消防'),
('architecture', 'GB 50763-2012', '无障碍设计规范', '无障碍规范', '2012版', '2012-03-30', '2012-09-01', 'current', '本规范适用于城市道路、建筑物等新建、改建和扩建工程的无障碍设计，对坡道、电梯、卫生间等作出规定。', '无障碍、坡道、电梯、卫生间、盲道'),
('architecture', 'GB 50189-2015', '公共建筑节能设计标准', '节能设计标准', '2015版', '2015-02-28', '2015-10-01', 'current', '本规范适用于新建、改建和扩建的公共建筑节能设计，对围护结构、暖通空调、照明等节能措施作出规定。', '节能、围护结构、保温、暖通、照明'),
('architecture', 'GB 50033-2013', '建筑采光设计标准', '采光标准', '2013版', '2013-05-13', '2014-06-01', 'current', '本规范适用于建筑采光设计，对采光系数、采光面积等作出规定。', '采光、窗户、玻璃、日照'),
('architecture', 'GB 50096-2011', '住宅设计规范', '住宅规范', '2011版', '2011-07-26', '2012-08-01', 'current', '本规范适用于住宅建筑设计，对平面布局、面积计算、安全防护等作出规定。', '住宅、布局、面积、安全'),
('architecture', 'GB 50352-2019', '民用建筑设计统一标准', '设计统一标准', '2019版', '2019-03-13', '2019-10-01', 'current', '本规范适用于各类民用建筑设计，对设计的基本原则、技术要求等作出规定。', '民用建筑、设计标准、技术要求'),
('architecture', 'GB 50352-2005', '民用建筑设计通则', '设计通则', '2005版', '2005-05-09', '2005-07-01', 'revised', '本规范已被GB 50352-2019替代。', '民用建筑、设计通则'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 结构专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('structure', 'GB 50011-2010', '建筑抗震设计规范', '抗震规范', '2010版', '2010-05-31', '2010-12-01', 'current', '本规范适用于建筑抗震设计，对抗震设防烈度、抗震措施等作出规定。', '抗震、设防烈度、地震、抗震等级'),
('structure', 'GB 50010-2010', '混凝土结构设计规范', '混凝土规范', '2010版', '2010-08-18', '2011-07-01', 'current', '本规范适用于混凝土结构设计，对构件设计、配筋要求等作出规定。', '混凝土、钢筋、配筋、承载力'),
('structure', 'GB 50007-2011', '建筑地基基础设计规范', '地基基础规范', '2011版', '2011-07-26', '2012-08-01', 'current', '本规范适用于建筑地基基础设计，对基础形式、地基处理等作出规定。', '地基、基础、桩基、勘察'),
('structure', 'GB 50017-2017', '钢结构设计标准', '钢结构规范', '2017版', '2017-12-12', '2018-07-01', 'current', '本规范适用于钢结构设计，对构件设计、连接构造等作出规定。', '钢结构、焊接、螺栓、连接'),
('structure', 'JGJ 3-2010', '高层建筑混凝土结构技术规程', '高层结构规程', '2010版', '2010-10-21', '2011-10-01', 'current', '本规范适用于高层建筑混凝土结构设计，对结构布置、构件设计等作出规定。', '高层、混凝土、剪力墙、框架'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 给排水专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('plumbing', 'GB 50015-2019', '建筑给水排水设计标准', '给排水标准', '2019版', '2019-04-09', '2020-03-01', 'current', '本规范适用于建筑给水排水设计，对给水系统、排水系统等作出规定。', '给水、排水、管道、水泵'),
('plumbing', 'GB 50974-2014', '消防给水及消火栓系统技术规范', '消防水规范', '2014版', '2014-01-29', '2014-10-01', 'current', '本规范适用于消防给水及消火栓系统设计，对消防水源、消火栓等作出规定。', '消防、给水、消火栓、水池'),
('plumbing', 'GB 50242-2002', '建筑给水排水及采暖工程施工质量验收规范', '给排水验收规范', '2002版', '2002-03-11', '2002-04-01', 'current', '本规范适用于建筑给水排水及采暖工程施工质量验收。', '施工、验收、质量'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 电气专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('electrical', 'GB 50052-2009', '供配电系统设计规范', '供配电规范', '2009版', '2009-11-11', '2010-07-01', 'current', '本规范适用于供配电系统设计，对负荷分级、电源配置等作出规定。', '供配电、负荷、电源、配电'),
('electrical', 'GB 50034-2013', '建筑照明设计标准', '照明标准', '2013版', '2013-11-29', '2014-06-01', 'current', '本规范适用于建筑照明设计，对照度标准、照明功率密度等作出规定。', '照明、照度、灯具、功率密度'),
('electrical', 'GB 50054-2011', '低压配电设计规范', '低压配电规范', '2011版', '2011-07-29', '2012-06-01', 'current', '本规范适用于低压配电设计，对线路保护、接地等作出规定。', '低压、配电、保护、接地'),
('electrical', 'GB 50057-2010', '建筑物防雷设计规范', '防雷规范', '2010版', '2010-11-03', '2011-10-01', 'current', '本规范适用于建筑物防雷设计，对防雷分类、防雷措施等作出规定。', '防雷、接地、避雷针、保护'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 暖通专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('hvac', 'GB 50736-2012', '民用建筑供暖通风与空气调节设计规范', '暖通规范', '2012版', '2012-01-21', '2012-10-01', 'current', '本规范适用于民用建筑供暖通风与空调设计，对空调系统、通风系统等作出规定。', '空调、通风、供暖、制冷'),
('hvac', 'GB 51251-2017', '建筑防烟排烟系统技术标准', '防排烟标准', '2017版', '2017-11-20', '2018-08-01', 'current', '本规范适用于建筑防烟排烟系统设计，对排烟风机、排烟口等作出规定。', '排烟、通风、风机、防烟'),
('hvac', 'GB 50736-2012', '民用建筑供暖通风与空气调节设计规范', '暖通规范', '2012版', '2012-01-21', '2012-10-01', 'current', '本规范适用于民用建筑供暖通风与空调设计。', '暖通、空调、通风'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 消防专业规范
INSERT INTO standards_library (category, code, title, short_name, version, publish_date, effective_date, status, summary, keywords) VALUES
('fire', 'GB 50116-2013', '火灾自动报警系统设计规范', '火灾报警规范', '2013版', '2013-09-06', '2014-05-01', 'current', '本规范适用于火灾自动报警系统设计，对探测器布置、报警系统等作出规定。', '火灾、报警、探测器、消防'),
('fire', 'GB 50140-2005', '建筑灭火器配置设计规范', '灭火器规范', '2005版', '2005-07-15', '2005-10-01', 'current', '本规范适用于建筑灭火器配置设计，对灭火器类型、数量等作出规定。', '灭火器、消防器材、配置'),
('fire', 'GB 50084-2017', '自动喷水灭火系统设计规范', '喷淋规范', '2017版', '2017-05-27', '2018-01-01', 'current', '本规范适用于自动喷水灭火系统设计，对喷头布置、系统设计等作出规定。', '喷淋、自动喷水、灭火、喷头'),
ON CONFLICT (category, code, version) DO NOTHING;

-- 添加一些示例条款
INSERT INTO standard_articles (standard_id, article_code, article_content, section_code, section_title, keywords, requirement_level)
SELECT
  s.id,
  '5.3.1',
  '建筑防火分区应根据建筑用途、火灾危险性类别、建筑耐火等级等确定，每个防火分区的最大允许建筑面积应符合下列规定：1. 单层建筑：2500平方米；2. 多层建筑：2500平方米；3. 高层建筑：1500平方米。',
  '5.3',
  '防火分区',
  '防火分区、面积、耐火等级',
  'mandatory'
FROM standards_library s
WHERE s.code = 'GB 50016-2014'
ON CONFLICT DO NOTHING;

INSERT INTO standard_articles (standard_id, article_code, article_content, section_code, section_title, keywords, requirement_level)
SELECT
  s.id,
  '5.5.18',
  '除本规范另有规定外，建筑内疏散门的净宽度不应小于0.9m，疏散走道和疏散楼梯的净宽度不应小于1.1m。',
  '5.5',
  '安全疏散',
  '疏散、宽度、门',
  'mandatory'
FROM standards_library s
WHERE s.code = 'GB 50016-2014'
ON CONFLICT DO NOTHING;

INSERT INTO standard_articles (standard_id, article_code, article_content, section_code, section_title, keywords, requirement_level)
SELECT
  s.id,
  '6.3.3',
  '柱的截面尺寸不宜小于400mm，柱的净高与截面长边尺寸之比不宜大于4。',
  '6.3',
  '框架结构',
  '柱、截面、尺寸',
  'mandatory'
FROM standards_library s
WHERE s.code = 'GB 50011-2010'
ON CONFLICT DO NOTHING;

INSERT INTO standard_articles (standard_id, article_code, article_content, section_code, section_title, keywords, requirement_level)
SELECT
  s.id,
  '4.1.2',
  '排水管道的管径应经过水力计算确定。生活排水立管的最大设计排水能力，应按表4.1.2确定。',
  '4.1',
  '排水系统',
  '排水、管径、管道',
  'mandatory'
FROM standards_library s
WHERE s.code = 'GB 50015-2019'
ON CONFLICT DO NOTHING;
