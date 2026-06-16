from database import engine

try:
    connection = engine.connect()

    print("Database Connect ho chuka")

    connection.close()

except Exception as e:
    print(e)