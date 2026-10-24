#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import re

PROJECT_ROOT = '/Users/tanghunganh/Project Z'
HOTUPDATE_DIR = os.path.join(PROJECT_ROOT, 'Product Game Z/super_hero_game/patch_scripts/patch_output')
HEROES_DIR = os.path.join(PROJECT_ROOT, 'web_portal/content/games/sieu-anh-hung/heroes')
ICON_HEROES_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/heroes/icon_heroes')
FULL_HEROES_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/heroes/full')
SKILL_HEROES_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/icon_skill_heroes')
SKILL_BUFF_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/icon_skill_buff')
WEAPON_HEROES_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/icon_weapon_heroes')
CHUYEN_SINH_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/icon_chuyen_sinh')
GAME_ITEMS_DIR = os.path.join(PROJECT_ROOT, 'web_portal/public/images/resources/game_items')

def resolve_skill_icon(icon_name):
    if not icon_name:
        return "/images/icon_skill_heroes/default_skill.png"
    base = f"{icon_name}.png" if not icon_name.endswith('.png') else icon_name
    return f"/images/icon_skill_heroes/{base}"

def main():
    print(">>> Đang nạp config game gốc...")
    with open(os.path.join(HOTUPDATE_DIR, 'character_detail.config'), 'r', encoding='utf-8') as f:
        chars = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'character_break_new.config'), 'r', encoding='utf-8') as f:
        breaks = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'super_evolution.config'), 'r', encoding='utf-8') as f:
        super_evos = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'super_evo_team.config'), 'r', encoding='utf-8') as f:
        super_teams = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'item.config'), 'r', encoding='utf-8') as f:
        items = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'skill_detail.config'), 'r', encoding='utf-8') as f:
        skills = json.load(f)
    with open(os.path.join(HOTUPDATE_DIR, 'chain.config'), 'r', encoding='utf-8') as f:
        chains = json.load(f)

    # Đọc ct-kurosaki mẫu hiện tại để lấy afterlifeMaterials chuẩn
    with open(os.path.join(HEROES_DIR, 'ct-kurosaki.json'), 'r', encoding='utf-8') as f:
        ct_kurosaki_sample = json.load(f)

    afterlife_materials = ct_kurosaki_sample.get('afterlifeMaterials', [])
    afterlife_req_text = ct_kurosaki_sample.get('afterlifeRequirementsText', '')
    best_synergies = ct_kurosaki_sample.get('bestSynergies', [])
    counters = ct_kurosaki_sample.get('counters', [])
    base_hero = ct_kurosaki_sample.get('baseHero', {
        "id": "35700",
        "slug": "kurosaki",
        "name": "Kurosaki",
        "avatar": "/images/heroes/icon_heroes/kurosaki.png",
        "rarity": "SSR",
        "role": "Tanker"
    })
    destiny = ct_kurosaki_sample.get('destiny', [])

    break_aura_colors = {
        1: 'emerald',
        2: 'cyan',
        3: 'purple',
        4: 'amber',
        5: 'red',
        6: 'rose',
        7: 'violet'
    }

    sth_tier_configs = [
        {'level': 1, 'tierLabel': 'Đỏ', 'frame': '/images/card_layers/card_q_bgRed.png', 'nameplateColor': 'bg-red-900 border-amber-500'},
        {'level': 2, 'tierLabel': 'Đỏ +', 'frame': '/images/card_layers/card_q_bgRed1.png', 'nameplateColor': 'bg-red-900 border-amber-500'},
        {'level': 3, 'tierLabel': 'Đỏ ++', 'frame': '/images/card_layers/card_q_bgRed2.png', 'nameplateColor': 'bg-red-950 border-amber-400'},
        {'level': 4, 'tierLabel': 'Vàng', 'frame': '/images/card_layers/card_q_bgYellow.png', 'nameplateColor': 'bg-amber-950 border-amber-500'},
        {'level': 5, 'tierLabel': 'Vàng +', 'frame': '/images/card_layers/card_q_bgGolden1.png', 'nameplateColor': 'bg-amber-950 border-amber-400'},
        {'level': 6, 'tierLabel': 'Vàng ++', 'frame': '/images/card_layers/card_q_bgGolden2.png', 'nameplateColor': 'bg-black border-amber-400'},
        {'level': 7, 'tierLabel': 'Vàng Cực Hạn 1', 'frame': '/images/card_layers/card_q_bgGolden2.png', 'nameplateColor': 'bg-black border-amber-400'},
        {'level': 8, 'tierLabel': 'Vàng Cực Hạn 2', 'frame': '/images/card_layers/card_q_bgGolden2.png', 'nameplateColor': 'bg-black border-amber-400'}
    ]

    def get_hero_info_for_material(target_cid):
        cid_str = str(target_cid)
        c = chars.get(cid_str, {})
        name = c.get('name', '').strip() or f"Tướng {cid_str}"
        # map name to slug
        slug_map = {
            '4100': ('kamui', '/images/heroes/icon_heroes/kamui.png'),
            '2200': ('pikachu', '/images/heroes/icon_heroes/pikachu.png'),
            '1900': ('chopper', '/images/heroes/icon_heroes/chopper.png'),
            '35700': ('kurosaki', '/images/heroes/icon_heroes/kurosaki.png'),
            '4800': ('edward', '/images/heroes/icon_heroes/edward.png'),
            '4200': ('sailor-moon', '/images/heroes/icon_heroes/sailor-moon.png'),
            '3500': ('yasuo', '/images/heroes/icon_heroes/yasuo.png'),
            '4400': ('doraemon', '/images/heroes/icon_heroes/doraemon.png')
        }
        if cid_str in slug_map:
            s, av = slug_map[cid_str]
            return name, s, av
        return name, "hero", "/images/heroes/icon_heroes/default_hero.png"

    def build_form(cid, slug, name, title, avatar, fullArt, overview, tags):
        c = chars[cid]
        b_data = breaks[cid]
        se_entry = super_evos[cid]

        # 1. Skills
        # Skill to CS mapping:
        # 1 -> CS1
        # 2 -> CS2
        # 3 -> CS3
        # 4 -> CS6
        # 5 -> CS7
        # 6 -> CS4
        # 7 -> CS5
        cs_map = {1: 1, 2: 2, 3: 3, 4: 6, 5: 7, 6: 4, 7: 5}

        hero_skills = []
        for i in range(1, 8):
            s_src = c.get(f'skill_{i}_source')
            if not s_src: continue
            sid = str(s_src[0][0])
            sk = skills.get(sid, {})
            s_name = sk.get('skill_name', '')
            s_icon = resolve_skill_icon(sk.get('skill_icon', ''))
            s_cd = f"{sk.get('cd')} hiệp" if sk.get('cd') and sk.get('cd') < 90 else None
            s_desc = sk.get('skill_story', '').replace('effect%', '350%').strip()

            target_cs_lvl = cs_map.get(i)
            cs_title = b_data.get(f'name{target_cs_lvl}', '')
            cs_desc = b_data.get(f'story_detail{target_cs_lvl}', '')

            sk_obj = {
                'name': s_name,
                'icon': s_icon,
                'description': s_desc,
                'cooldown': s_cd,
                'breakthrough': {
                    'level': target_cs_lvl,
                    'title': cs_title,
                    'description': cs_desc
                }
            }
            hero_skills.append(sk_obj)

        # 2. breakthroughSimData
        sim_breaks = []
        for lvl in range(1, min(8, b_data.get('high_break', 7) + 1)):
            b_title = b_data.get(f'name{lvl}', '') or f"Cấp {lvl}"
            raw_tier = b_title.split('·')[0].strip() if '·' in b_title else b_title.split('-')[0].strip()
            tier_name = raw_tier if raw_tier else f"CS{lvl}"
            
            target_sk = next((s for s in hero_skills if s.get('breakthrough', {}).get('level') == lvl), None)
            sk_n = target_sk['name'] if target_sk else f"Kỹ năng {lvl}"
            sk_ic = target_sk['icon'] if target_sk else "/images/heroes/icon_heroes/default_hero.png"
            sk_d = b_data.get(f'story_detail{lvl}', '')

            mats = []
            for m in b_data.get(f'material{lvl}', []):
                if len(m) >= 3:
                    mtype, mid, mcount = m[0], m[1], m[2]
                    if mtype == 6:
                        it = items.get(str(mid), {})
                        iname = it.get('name', f"Vật phẩm {mid}").strip()
                        icon_name = it.get('icon', '')
                        cand = f"{icon_name}.png" if icon_name and not icon_name.endswith('.png') else (icon_name or "i_b_0_0.png")
                        if os.path.exists(os.path.join(CHUYEN_SINH_DIR, cand)):
                            icon_url = f"/images/icon_chuyen_sinh/{cand}"
                        elif os.path.exists(os.path.join(GAME_ITEMS_DIR, cand)):
                            icon_url = f"/images/resources/game_items/{cand}"
                        else:
                            icon_url = "/images/icon_chuyen_sinh/i_b_0_0.png"
                        mats.append({
                            'name': iname,
                            'icon': icon_url,
                            'amount': mcount,
                            'type': 'item'
                        })
                    elif mtype == 5:
                        pname, pslug, pav = get_hero_info_for_material(mid)
                        mats.append({
                            'name': pname,
                            'icon': pav,
                            'amount': mcount,
                            'type': 'hero'
                        })

            sim_breaks.append({
                'level': lvl,
                'title': b_title,
                'tierName': tier_name,
                'auraColor': break_aura_colors.get(lvl, 'purple'),
                'skillName': sk_n,
                'skillIcon': sk_ic,
                'skillDesc': sk_d,
                'materials': mats,
                'starsCount': lvl if lvl <= 5 else 0,
                'moonsCount': 1 if lvl == 6 else (2 if lvl >= 7 else 0)
            })

        # 3. superEvoSimData
        sim_sth = []
        for sth_cfg in sth_tier_configs:
            lvl = sth_cfg['level']
            team_ids = se_entry.get(f'level_{lvl}_need', [])
            
            materials = []
            for tid in team_ids:
                st = super_teams.get(str(tid), {})
                c_need = st.get('card_need')
                if c_need is not None:
                    if c_need == -1 or c_need <= 0:
                        materials.append({
                            'name': name,
                            'icon': avatar,
                            'slug': slug
                        })
                    else:
                        pname, pslug, pav = get_hero_info_for_material(c_need)
                        materials.append({
                            'name': pname,
                            'icon': pav,
                            'slug': pslug
                        })
            
            adds = se_entry.get(f'level_{lvl}_add', [])
            add_parts = []
            for a in adds:
                if len(a) >= 2:
                    atype, aval = a[0], a[1]
                    val_int = int(aval)
                    if atype == 1: add_parts.append(f"+{val_int} Công")
                    elif atype == 2: add_parts.append(f"+{val_int} Thủ")
                    elif atype == 3: add_parts.append(f"+{val_int} HP")
                    elif atype == 4: add_parts.append(f"+{val_int} Tốc")
            stat_bonus = ", ".join(add_parts) if add_parts else "+360 Công, +356 Thủ, +158 HP, +324 Tốc"

            unlocked_sk = None
            unlocked_ic = None
            if lvl == se_entry.get('skill4_open') and len(hero_skills) >= 6:
                unlocked_sk = hero_skills[5]['name']
                unlocked_ic = hero_skills[5]['icon']
            elif lvl == se_entry.get('skill5_open') and len(hero_skills) >= 7:
                unlocked_sk = hero_skills[6]['name']
                unlocked_ic = hero_skills[6]['icon']

            sim_sth.append({
                'level': lvl,
                'materials': materials,
                'statBonus': stat_bonus,
                'unlockedSkill': unlocked_sk,
                'unlockedSkillIcon': unlocked_ic,
                'tierLabel': sth_cfg['tierLabel'],
                'frame': sth_cfg['frame'],
                'nameplateColor': sth_cfg['nameplateColor']
            })

        data = {
            "id": cid,
            "slug": slug,
            "name": name,
            "title": title,
            "gameSlug": "sieu-anh-hung",
            "avatar": avatar,
            "fullArt": fullArt,
            "element": "Vũ trụ sức mạnh",
            "isAfterlifeForm": True,
            "isSkinForm": False,
            "rarity": "UR",
            "role": "Tanker",
            "tier": "S+",
            "overview": overview,
            "skills": hero_skills,
            "bestSynergies": best_synergies,
            "counters": counters,
            "afterlifeRequirementsText": afterlife_req_text,
            "afterlifeMaterials": afterlife_materials,
            "breakthroughSimData": sim_breaks,
            "superEvoSimData": sim_sth,
            "combatTags": tags,
            "baseHero": base_hero,
            "destiny": destiny
        }
        return data

    # 1. Dạng 1: CT-Kurosaki (Thánh)
    form1 = build_form(
        cid="64600",
        slug="ct-kurosaki-thanh",
        name="CT-Kurosaki (Thánh)",
        title="Vũ trụ sức mạnh • UR CT-Kurosaki (Thánh)",
        avatar="/images/heroes/icon_heroes/icon_Ichig.png",
        fullArt="/images/heroes/full/image_Ichig.png",
        overview="Dạng thức tỉnh Thánh/Thủy Giải của Kurosaki với kỹ năng Vạn Giải mở rộng, mang khả năng miễn thương và phản đòn toàn năng.",
        tags=["Chống Chịu", "Miễn Thương", "Phản Đòn", "Chế Giễu", "Vạn Giải", "Hồi Phục"]
    )
    with open(os.path.join(HEROES_DIR, 'ct-kurosaki-thanh.json'), 'w', encoding='utf-8') as f:
        json.dump(form1, f, ensure_ascii=False, indent=2)
    print(">>> Đã tạo ct-kurosaki-thanh.json (ID 64600)")

    # 2. Dạng 2: CT-Kurosaki (Mugetsu)
    form2 = build_form(
        cid="65500",
        slug="ct-kurosaki-mugetsu",
        name="CT-Kurosaki (Mugetsu)",
        title="Vũ trụ sức mạnh • UR CT-Kurosaki (Mugetsu)",
        avatar="/images/heroes/icon_heroes/icon_Ichig1.png",
        fullArt="/images/heroes/full/image_Ichig_1.png",
        overview="Dạng Vô Nguyệt (Mugetsu) tối thượng của Kurosaki, giải phóng toàn bộ linh áp, sở hữu Vách Thứ Nguyên, Linh Áp Bạo Phát và Bleach.Liên Vũ.",
        tags=["Chống Chịu", "Hồi Sinh", "Phản Đòn", "Chế Giễu", "Hoảng Sợ", "Tấn Công Toàn Thể"]
    )
    with open(os.path.join(HEROES_DIR, 'ct-kurosaki-mugetsu.json'), 'w', encoding='utf-8') as f:
        json.dump(form2, f, ensure_ascii=False, indent=2)
    print(">>> Đã tạo ct-kurosaki-mugetsu.json (ID 65500)")

    # 3. Dạng 3: Cập nhật ct-kurosaki.json (ID 65600 - Hư Hóa)
    form3 = build_form(
        cid="65600",
        slug="ct-kurosaki",
        name="CT-Kurosaki (Hư Hóa)",
        title="Vũ trụ sức mạnh • UR CT-Kurosaki (Hư Hóa)",
        avatar="/images/heroes/icon_heroes/icon_Ichig2.png",
        fullArt="/images/heroes/full/image_Ichig_2.png",
        overview="Dạng Hư Hóa (Vasto Lorde) mặt nạ sọc đỏ uy mãnh của Kurosaki, giải phóng Lực Vương Hư, Hư Vô Trảm và Vương Hư.Sáng.",
        tags=["Chống Chịu", "Khống Chế", "Chế Giễu", "Tsukuyomi", "Phản Đòn", "Hồi Phục"]
    )
    with open(os.path.join(HEROES_DIR, 'ct-kurosaki.json'), 'w', encoding='utf-8') as f:
        json.dump(form3, f, ensure_ascii=False, indent=2)
    print(">>> Đã cập nhật ct-kurosaki.json (ID 65600)")

    # 4. Cập nhật kurosaki.json (afterlifeForms)
    with open(os.path.join(HEROES_DIR, 'kurosaki.json'), 'r', encoding='utf-8') as f:
        kurosaki_data = json.load(f)

    kurosaki_data['afterlifeForms'] = [
        {
            "slug": "ct-kurosaki-thanh",
            "name": "CT-Kurosaki (Thánh)",
            "avatar": "/images/heroes/icon_heroes/icon_Ichig.png",
            "rarity": "UR",
            "role": "Tanker",
            "overview": "Dạng thức tỉnh Thánh/Thủy Giải của Kurosaki với kỹ năng Vạn Giải mở rộng, mang khả năng miễn thương và phản đòn toàn năng."
        },
        {
            "slug": "ct-kurosaki-mugetsu",
            "name": "CT-Kurosaki (Mugetsu)",
            "avatar": "/images/heroes/icon_heroes/icon_Ichig1.png",
            "rarity": "UR",
            "role": "Tanker",
            "overview": "Dạng Vô Nguyệt (Mugetsu) tối thượng của Kurosaki, giải phóng toàn bộ linh áp, sở hữu Vách Thứ Nguyên, Linh Áp Bạo Phát và Bleach.Liên Vũ."
        },
        {
            "slug": "ct-kurosaki",
            "name": "CT-Kurosaki (Hư Hóa)",
            "avatar": "/images/heroes/icon_heroes/icon_Ichig2.png",
            "rarity": "UR",
            "role": "Tanker",
            "overview": "Dạng Hư Hóa (Vasto Lorde) mặt nạ sọc đỏ uy mãnh của Kurosaki, giải phóng Lực Vương Hư, Hư Vô Trảm và Vương Hư.Sáng."
        }
    ]

    with open(os.path.join(HEROES_DIR, 'kurosaki.json'), 'w', encoding='utf-8') as f:
        json.dump(kurosaki_data, f, ensure_ascii=False, indent=2)
    print(">>> Đã cập nhật afterlifeForms trong kurosaki.json (ID 35700)")

if __name__ == '__main__':
    main()
