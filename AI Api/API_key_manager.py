import os
import random
import dotenv

def get_api_key():
    keys = dotenv.dotenv_values(".env")

    keys_list = []

    keys_list.append(keys["GOOGLE_API_KEY1"])
    keys_list.append(keys["GOOGLE_API_KEY2"])
    keys_list.append(keys["GOOGLE_API_KEY3"])
    keys_list.append(keys["GOOGLE_API_KEY4"])
    keys_list.append(keys["GOOGLE_API_KEY5"])
    return random.choice(keys_list)